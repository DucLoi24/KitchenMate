"""
Background AI Moderation Task cho Recipe.

Chạy trong threading để không blocking request.
"""
import logging
import threading
from .ai_moderator import moderate_text, ModerationTimeoutError, ModerationServiceError

logger = logging.getLogger(__name__)

NO_CONTENT_REASON = "Nội dung công thức không phù hợp với tiêu chuẩn cộng đồng. Vui lòng chỉnh sửa và thử lại."
MODERATION_ERROR_REASON = "Đã xảy ra lỗi khi kiểm duyệt. Vui lòng thử lại sau."


def run_ai_moderation(recipe_id: int):
    """
    Background task: Load recipe by ID, run AI moderation, update visibility.

    Logic:
        1. Skip if ai_moderation_attempted == True (already processed)
        2. Mark ai_moderation_attempted = True immediately to prevent re-run
        3. Build text: title + description + steps
        4. Call moderate_text()
        5. Update based on result:
            - YES  → visibility = 'PUBLIC'
            - NO   → visibility = 'PRIVATE', moderation_reason = reason
            - SUSPECT → keep PENDING (Admin will handle manually)
        6. Save recipe

    This runs in a separate thread to avoid blocking the publish() request.
    """
    from apps.recipes.models import Recipe

    try:
        recipe = Recipe.objects.get(pk=recipe_id)
    except Recipe.DoesNotExist:
        logger.error("Recipe %s not found for AI moderation", recipe_id)
        return

    if recipe.ai_moderation_attempted:
        logger.info("Recipe %s already attempted AI moderation, skipping", recipe_id)
        return

    recipe.ai_moderation_attempted = True
    recipe.save(update_fields=['ai_moderation_attempted'])

    steps_text = '\n'.join(
        step.instruction
        for step in recipe.steps.order_by('step_number')
    )
    text_to_moderate = f"{recipe.title}\n{recipe.description}\n{steps_text}".strip()

    try:
        result = moderate_text(text_to_moderate)
    except (ModerationTimeoutError, ModerationServiceError) as e:
        logger.error("AI moderation error for recipe %s: %s", recipe_id, e)
        recipe.moderation_reason = MODERATION_ERROR_REASON
        recipe.save(update_fields=['moderation_reason'])
        return

    if result == 'YES':
        recipe.visibility = 'PUBLIC'
        recipe.save(update_fields=['visibility'])
        logger.info("Recipe %s approved by AI, set to PUBLIC", recipe_id)
    elif result == 'NO':
        recipe.visibility = 'PRIVATE'
        recipe.moderation_reason = NO_CONTENT_REASON
        recipe.save(update_fields=['visibility', 'moderation_reason'])
        logger.info("Recipe %s rejected by AI, set to PRIVATE", recipe_id)
    else:
        recipe.visibility = 'PENDING'
        recipe.save(update_fields=['visibility'])
        logger.info("Recipe %s SUSPECT by AI, kept PENDING for Admin review", recipe_id)


def trigger_async_moderation(recipe_id: int):
    """
    Spawn a background thread to run AI moderation.
    Non-blocking - returns immediately after thread starts.
    """
    thread = threading.Thread(
        target=run_ai_moderation,
        args=(recipe_id,),
        daemon=True
    )
    thread.start()
    logger.info("Spawned AI moderation thread for recipe %s", recipe_id)
