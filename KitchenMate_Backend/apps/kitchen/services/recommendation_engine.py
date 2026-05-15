"""
Recommendation Engine — Tier-3 Scoring Algorithm cho KitchenMate.

Scoring:
  +20  moi ingredient non-STAPLE co trong pantry
  penalty theo category cua ingredient thieu:
    PROTEIN: -100, CARB: -80, VEG: -50, OTHER: -25, SPICE: -10
  +50  Affinity Bonus neu recipe da duoc luu trong Collection cua user

Mode:
  COOK_NOW  — chi tra ve recipe co missing_count == 0
  ADD_MORE  — tra ve recipe co missing_count <= 2 VA score >= 0
"""
from django.db.models import Count, Exists, OuterRef, Q



PENALTY = {
    'PROTEIN': -100,
    'CARB': -80,
    'VEG': -50,
    'OTHER': -25,
    'SPICE': -10,
}


def calculate_recipe_score(recipe, pantry_ingredient_ids, saved_recipe_ids, unit_display_map=None):
    """
    Tinh diem goi y cho mot cong thuc dua tren pantry cua user.
    Bo qua nguyen lieu STAPLE.

    Args:
        recipe: Recipe instance (da prefetch recipe_ingredients__ingredient)
        pantry_ingredient_ids: set cac ingredient_id co trong pantry
        saved_recipe_ids: set cac recipe_id da luu trong Collection
        unit_display_map: dict map Unit.slug -> Unit.name de hien thi unit

    Returns:
        (score: int, missing_ingredients: list)
    """
    score = 0
    missing = []
    unit_display_map = unit_display_map or {}

    for ri in recipe.recipe_ingredients.all():
        if ri.ingredient.category == 'STAPLE':
            continue
        if ri.ingredient_id in pantry_ingredient_ids:
            score += 20
        else:
            score += PENALTY.get(ri.ingredient.category, -25)
            missing.append({
                'id': ri.ingredient_id,
                'name': ri.ingredient.name,
                'category': ri.ingredient.category,
                'quantity': ri.quantity,
                'unit': ri.unit,
                'unit_display': unit_display_map.get(ri.unit, ri.unit),
            })

    if recipe.id in saved_recipe_ids:
        score += 50

    return score, missing


def get_recommendations(user, mode, exclude_ingredient_ids=None, cooking_time=None, category_ids=None):
    """
    Lay danh sach cong thuc goi y theo mode COOK_NOW hoac ADD_MORE.

    Args:
        user: User instance
        mode: 'COOK_NOW' hoac 'ADD_MORE'
        exclude_ingredient_ids: list cac ingredient_id can loai tru (optional)
        cooking_time: list cac moc thoi gian 15, 30, 60, 120 (optional)
        category_ids: list UUID danh muc cong thuc active can loc (optional)

    Returns:
        list of dict: [{'recipe': Recipe, 'score': int, 'missing_ingredients': list}]
        Da sap xep theo score giam dan.
    """
    from apps.recipes.models import Recipe
    from apps.social.models import Collection, CollectionRecipe
    from apps.ingredients.models import Unit

    pantry_ingredient_ids = set(
        user.pantry_items.values_list('ingredient_id', flat=True)
    )
    saved_recipe_ids = set(
        CollectionRecipe.objects.filter(
            collection__user=user
        ).values_list('recipe_id', flat=True)
    )

    favorites_collection = Collection.objects.filter(
        user=user, is_favorites=True
    ).values_list('id', flat=True)
    user_collections = Collection.objects.filter(
        user=user
    ).values_list('id', flat=True)

    recipes = Recipe.objects.filter(
        visibility='PUBLIC'
    ).select_related('user').prefetch_related(
        'recipe_ingredients__ingredient',
        'categories',
        'steps'
    ).annotate(
        like_count=Count(
            'saved_in_collections__collection',
            filter=Q(saved_in_collections__collection__is_favorites=True),
            distinct=True
        ),
        save_count=Count(
            'saved_in_collections__collection',
            filter=Q(saved_in_collections__collection__is_favorites=False),
            distinct=True
        ),
        is_favorited=Exists(
            CollectionRecipe.objects.filter(
                collection_id__in=favorites_collection,
                recipe_id=OuterRef('pk')
            )
        ),
        is_in_collection=Exists(
            CollectionRecipe.objects.filter(
                collection_id__in=user_collections,
                recipe_id=OuterRef('pk')
            )
        ),
    )

    if exclude_ingredient_ids:
        recipes = recipes.exclude(
            recipe_ingredients__ingredient_id__in=exclude_ingredient_ids
        ).distinct()

    if cooking_time:
        time_values = {
            int(value)
            for value in cooking_time
            if str(value).strip().isdigit()
        }
        time_filter = Q()
        for value in time_values:
            if value == 15:
                time_filter |= Q(prep_time__lte=15)
            elif value == 30:
                time_filter |= Q(prep_time__gte=15, prep_time__lte=30)
            elif value == 60:
                time_filter |= Q(prep_time__gte=30, prep_time__lte=60)
            elif value == 120:
                time_filter |= Q(prep_time__gte=60)
        if time_filter:
            recipes = recipes.filter(time_filter).distinct()

    if category_ids:
        recipes = recipes.filter(
            categories__id__in=category_ids,
            categories__is_active=True
        ).distinct()

    # Evaluate queryset thành list để đảm bảo prefetch_related hoạt động đúng
    recipes_list = list(recipes)
    unit_display_map = {
        slug: name
        for slug, name in Unit.objects.values_list('slug', 'name')
    }

    results = []
    for recipe in recipes_list:
        score, missing = calculate_recipe_score(
            recipe,
            pantry_ingredient_ids,
            saved_recipe_ids,
            unit_display_map=unit_display_map
        )
        missing_count = len(missing)

        if mode == 'COOK_NOW' and missing_count == 0:
            results.append({'recipe': recipe, 'score': score, 'missing_ingredients': missing})
        elif mode == 'ADD_MORE' and missing_count <= 2 and score >= 0:
            results.append({'recipe': recipe, 'score': score, 'missing_ingredients': missing})

    results.sort(key=lambda x: x['score'], reverse=True)
    return results
