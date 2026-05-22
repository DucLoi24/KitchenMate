"""
Background AI Moderation Task cho Recipe.

Chạy trong threading để không blocking request.
"""
import logging
import threading
from .ai_moderator import moderate_text, ModerationTimeoutError, ModerationServiceError

logger = logging.getLogger(__name__)

# Module-level lock to serialize AI moderation - only 1 recipe processed at a time
moderation_lock = threading.Lock()

NO_CONTENT_REASON = "Nội dung công thức không phù hợp với tiêu chuẩn cộng đồng. Vui lòng chỉnh sửa và thử lại."
MODERATION_ERROR_REASON = "Đã xảy ra lỗi khi kiểm duyệt. Vui lòng thử lại sau."


def run_ai_moderation(recipe_id: int):
    """
    Background task: Load recipe by ID, run AI moderation, update visibility.

    Logic:
        1. Acquire moderation_lock (blocking with timeout) - wait for lock
        2. Skip if ai_moderation_status not 'PENDING' or AI already attempted
        3. Mark AI attempt as started
        4. Build text: title + description + steps
        5. Call moderate_text()
        6. Update ai_moderation_status based on result:
            - YES  → 'APPROVED', visibility = 'PUBLIC'
            - NO   → 'REJECTED', visibility = 'PRIVATE', rejection_reason = reason
            - SUSPECT → 'PENDING' (admin will handle manually)
        7. Release lock and pick up next unattempted PENDING recipe

    This runs in a separate thread to avoid blocking the publish() request.
    """
    from apps.recipes.models import Recipe

    # Try to acquire lock - if another recipe is being moderated, skip (stay PENDING)
    if not moderation_lock.acquire(blocking=False):
        logger.info("Recipe %s skipped - another recipe is being moderated", recipe_id)
        return

    try:
        try:
            recipe = Recipe.objects.get(pk=recipe_id)
        except Recipe.DoesNotExist:
            logger.error("Recipe %s not found for AI moderation", recipe_id)
            return

        if recipe.ai_moderation_status != 'PENDING':
            logger.info("Recipe %s not in PENDING state (status=%s), skipping", recipe_id, recipe.ai_moderation_status)
            return

        if recipe.ai_moderation_attempted:
            logger.info("Recipe %s already attempted AI moderation, skipping", recipe_id)
            return

        # AI starts reading this recipe - set PROCESSING so admin knows which one
        recipe.ai_moderation_status = 'PROCESSING'
        recipe.ai_moderation_attempted = True
        recipe.save(update_fields=['ai_moderation_status', 'ai_moderation_attempted'])

        steps_text = '\n'.join(
            step.instruction
            for step in recipe.steps.order_by('step_number')
        )
        text_to_moderate = f"{recipe.title}\n{recipe.description}\n{steps_text}".strip()

        try:
            result = moderate_text(text_to_moderate)
        except (ModerationTimeoutError, ModerationServiceError) as e:
            logger.error("AI moderation error for recipe %s: %s", recipe_id, e)
            recipe.rejection_reason = MODERATION_ERROR_REASON
            recipe.ai_moderation_status = 'PENDING'
            recipe.save(update_fields=['rejection_reason', 'ai_moderation_status'])
            return

        if result == 'YES':
            recipe.visibility = 'PUBLIC'
            recipe.ai_moderation_status = 'APPROVED'
            recipe.save(update_fields=['visibility', 'ai_moderation_status'])
            logger.info("Recipe %s approved by AI, set to PUBLIC", recipe_id)
        elif result == 'NO':
            recipe.visibility = 'PRIVATE'
            recipe.rejection_reason = NO_CONTENT_REASON
            recipe.ai_moderation_status = 'REJECTED'
            recipe.save(update_fields=['visibility', 'rejection_reason', 'ai_moderation_status'])
            logger.info("Recipe %s rejected by AI, set to PRIVATE", recipe_id)
        else:
            recipe.ai_moderation_status = 'PENDING'
            recipe.save(update_fields=['ai_moderation_status'])
            logger.info("Recipe %s SUSPECT by AI, kept PENDING for Admin review", recipe_id)
    finally:
        lock_held = moderation_lock.locked()
        moderation_lock.release()
        if not lock_held:
            return
        # Pick up next PENDING recipe in a new thread (don't process inline)
        next_recipe = Recipe.objects.filter(
            ai_moderation_status='PENDING',
            ai_moderation_attempted=False,
        ).order_by('created_at').first()
        if next_recipe:
            logger.info("Queue: picking up next PENDING recipe: %s", next_recipe.id)
            thread = threading.Thread(
                target=run_ai_moderation,
                args=(next_recipe.id,),
                daemon=True
            )
            thread.start()


def trigger_async_moderation(recipe_id: int):
    """
    Spawn a background thread to run AI moderation.
    Non-blocking - returns immediately after thread starts.
    Sets PENDING status and resets the AI attempt marker for a fresh moderation run.
    """
    from apps.recipes.models import Recipe

    try:
        recipe = Recipe.objects.get(pk=recipe_id)
    except Recipe.DoesNotExist:
        logger.error("Recipe %s not found for AI moderation", recipe_id)
        return

    recipe.visibility = 'PENDING'
    recipe.ai_moderation_status = 'PENDING'
    recipe.ai_moderation_attempted = False
    recipe.rejection_reason = None
    recipe.save(update_fields=[
        'visibility',
        'ai_moderation_status',
        'ai_moderation_attempted',
        'rejection_reason',
    ])

    thread = threading.Thread(
        target=run_ai_moderation,
        args=(recipe_id,),
        daemon=True
    )
    thread.start()
    logger.info("Spawned AI moderation thread for recipe %s", recipe_id)
