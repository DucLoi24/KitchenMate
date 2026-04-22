# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

- `KitchenMate_Backend/` is the actual application: a Django 5.2 + DRF backend with PostgreSQL, JWT auth, drf-spectacular docs, and local Ollama-based moderation.
- `KitchenMate_Frontend/` currently contains backend-facing documentation snapshots (`backend_docs/`) and planning notes, not a runnable frontend app.
- The repo root is mainly coordination/config (`CLAUDE.md`, `AGENTS.md`, `.gitnexus/`). Most code changes should happen under `KitchenMate_Backend/`.

## GitNexus requirements

This project is indexed by GitNexus as **KitchenMate**. Use GitNexus to understand code, assess impact, and navigate safely.

- Before modifying any function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius.
- If impact analysis returns HIGH or CRITICAL risk, warn the user before editing.
- When exploring unfamiliar behavior, prefer `gitnexus_query({query: "concept"})` over raw grep so you can see execution flows.
- Use `gitnexus_context({name: "symbolName"})` for callers/callees and process membership.
- Before committing, run `gitnexus_detect_changes()` to verify the affected symbols and flows match expectations.
- For renames, use `gitnexus_rename(..., dry_run: true)` first; never do symbol renames with find-and-replace.
- If GitNexus reports a stale index, run `npx gitnexus analyze` from the repo root before trusting results.

## Common commands

Run backend commands from `KitchenMate_Backend/`.

### Environment setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
```

### Development server

```bash
python manage.py runserver
```

API docs are exposed at:

- `/api/docs/` — Swagger UI
- `/api/redoc/` — ReDoc
- `/api/schema/` — OpenAPI schema

### Tests

```bash
pytest
pytest -m unit
pytest -m integration
pytest -m performance
pytest tests/test_some_file.py
pytest tests/test_some_file.py::TestClass::test_case
pytest -k keyword
```

Pytest is configured via `KitchenMate_Backend/pytest.ini` with markers: `unit`, `integration`, `performance`, `pbt`.

### Database and Django utilities

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py shell
python manage.py createsuperuser
```

## Runtime architecture

KitchenMate is a backend-only client/server system: Django REST Framework serves JSON APIs to an external frontend, with PostgreSQL as the primary store and Ollama as a local moderation dependency.

Request flow is typically:

1. `core/urls.py` routes into an app module under `apps/`
2. DRF views/viewsets validate input with serializers
3. Models persist to PostgreSQL
4. Shared cross-cutting behavior lives under `core/` (permissions, exception formatting, AI moderation, file/media utilities)

## Application structure

### Core platform layer

- `core/settings.py` wires env-driven settings, PostgreSQL, JWT, CORS, drf-spectacular, media storage, and Ollama configuration.
- `core/urls.py` is the top-level route map for all app endpoints.
- `core.exceptions` provides the custom DRF exception handler.
- `core.permissions` contains ownership/admin permission classes reused across apps.
- `core.services.ai_moderator` is the shared moderation boundary around Ollama.
- `core.utils` / media services handle file validation, image processing, and upload orchestration.

### Domain apps

- `apps.accounts/`: custom user model, JWT register/login/logout, self-service profile endpoints, password change/reset, and avatar upload.
- `apps.ingredients/`: ingredient catalog plus AI-moderated user submissions. Public reads only return `APPROVED` ingredients.
- `apps.recipes/`: recipe CRUD, visibility workflow, filtering, stats, publish flow, thumbnail/step uploads.
- `apps.kitchen/`: pantry and shopping list management plus recommendation endpoints.
- `apps.social/`: reviews and collections; collections feed recommendation affinity scoring.
- `apps.admin_panel/`: staff-only moderation endpoints for approving/rejecting recipes and ingredients and managing users.

## Key business workflows

### Recipe visibility lifecycle

The core recipe workflow is `PRIVATE -> PUBLIC` or `PRIVATE -> PENDING -> PUBLIC/PRIVATE`.

- New recipes are created as `PRIVATE`.
- `publish` sends recipe content through AI moderation.
- `YES` publishes directly to `PUBLIC`.
- `SUSPECT` moves the recipe to `PENDING` for admin review.
- `NO` rejects publication.
- Non-owners receive `404` for private/pending recipes so existence is not leaked.

This behavior is centered in `apps.recipes.views.RecipeViewSet`.

### Ingredient moderation

Ingredient creation is more permissive than recipe publishing:

- user-created ingredients go through moderation
- `NO` rejects creation
- `YES`, `SUSPECT`, or moderation failures still save as `PENDING`
- admins later approve/reject through `apps.admin_panel`

This keeps community contribution from being blocked when Ollama is unavailable.

### Recommendation engine

`apps.kitchen.services.recommendation_engine` implements the project’s Tier-3 scoring model.

Important rules:

- `STAPLE` ingredients are ignored during scoring
- present ingredients score `+20`
- missing ingredients apply category penalties (`PROTEIN` is the harshest penalty)
- saved recipes in collections get a `+50` affinity bonus
- `COOK_NOW` only returns recipes with no missing non-staple ingredients
- `ADD_MORE` allows up to 2 missing ingredients if the score stays non-negative

Recommendations depend on pantry contents plus `social.CollectionRecipe` state.

### Shopping list to pantry sync

`apps.kitchen.views.ShoppingListViewSet.mark_purchased` uses `transaction.atomic()` to:

1. mark a shopping item purchased
2. `get_or_create` the matching pantry row
3. increment pantry quantity

Treat this as a data integrity boundary: if you change the flow, preserve the all-or-nothing behavior.

### File uploads

Uploads are centralized shared infrastructure, not ad hoc per app.

Current upload types:

- user avatars
- recipe thumbnails
- recipe step media
- cooksnap review photos

The upload pipeline validates extension/size/content, resizes and compresses images, then writes under `MEDIA_ROOT`.

## API shape and conventions

- Responses are commonly wrapped as `{ "success": true|false, "data": ... }` or `{ "success": false, "error": ... }`.
- Most list endpoints paginate through DRF’s page-number pagination.
- Ownership is enforced at the view layer with custom permissions and filtered querysets.
- Public/private visibility and admin moderation are central design concepts across multiple apps, not isolated one-off checks.

## Testing structure

- Shared fixtures live in `KitchenMate_Backend/tests/conftest.py`.
- Tests use `rest_framework.test.APIClient` heavily and rely on fixture-created users, ingredients, recipes, pantry items, and admin accounts.
- When adding coverage, prefer following the existing API-level pytest style rather than introducing a separate testing pattern.

## Environment assumptions

Backend settings are driven by `.env`.

Important variables verified in `core/settings.py`:

- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `DB_*`
- `JWT_ACCESS_TOKEN_LIFETIME`
- `JWT_REFRESH_TOKEN_LIFETIME`
- `FRONTEND_URL`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `OLLAMA_TIMEOUT`
- optional S3-related vars for production storage

The backend defaults to PostgreSQL, not SQLite.

## Notes for future Claude sessions

- `KitchenMate_Frontend/` là một React + Vite frontend codebase đang active, không phải chỉ documentation. Frontend sử dụng Tailwind CSS, Zustand (auth state), React Router DOM, Axios, và React Query.
- The root `CLAUDE.md` should stay focused on the real working code in `KitchenMate_Backend/` plus the GitNexus workflow.
- If you need deeper backend domain details, `KitchenMate_Frontend/backend_docs/` contains architectural writeups and workflow docs that summarize the backend design.
- Use Vietnamese when communicating with users. Web application for Vietnamese users.
- If you want to use the GitHub tool, use the "gh" command (Github CLI).
- When you need to test a website, use the "playwright" plugin.
- Make the most of the effectiveness of plugins.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **KitchenMate** (1816 symbols, 3331 relationships, 73 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/KitchenMate/context` | Codebase overview, check index freshness |
| `gitnexus://repo/KitchenMate/clusters` | All functional areas |
| `gitnexus://repo/KitchenMate/processes` | All execution flows |
| `gitnexus://repo/KitchenMate/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
