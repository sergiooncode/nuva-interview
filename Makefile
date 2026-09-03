SHELL := /bin/bash
COMPOSE := docker compose
DATABASE_URL ?= postgres://yaya:yaya@localhost:5432/yaya
TEST_DATABASE_URL ?= postgres://yaya:yaya@localhost:5432/yaya_test
CSV_PATH ?= ./data/sre-ai-coding-test-data.csv

.DEFAULT_GOAL := help
.PHONY: help install ci lint typecheck test test-watch build audit up down logs ps migrate seed psql smoke clean

help: ## List the available targets
	@grep -hE '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install workspace dependencies from the lockfile
	npm ci

# ---------------------------------------------------------------------------
# CI. Each target below is one job in the pipeline, so what runs on a laptop and
# what runs on a runner are the same command rather than two drifting copies.
# ---------------------------------------------------------------------------

ci: lint typecheck test build ## Run every CI job in order

lint: ## ESLint, including the layering rules
	npm run lint

typecheck: ## tsc --noEmit across the workspace
	npm run typecheck

test: ## Vitest, single pass (Postgres suite skips without a database)
	npm run test:run

test-integration: ## Prove the SQL adapter agrees with the in-memory one, against a live database
	$(COMPOSE) exec -T postgres createdb -U yaya yaya_test 2>/dev/null || true
	TEST_DATABASE_URL=$(TEST_DATABASE_URL) npm run test:run

test-watch: ## Vitest in watch mode
	npm test

build: ## Production build of the web app
	npm run build

audit: ## Fail on known high-severity advisories
	npm audit --audit-level=high

# ---------------------------------------------------------------------------
# Local stack
# ---------------------------------------------------------------------------

up: ## Build and start postgres, migrate, seed, api and web
	$(COMPOSE) up --build -d
	@echo "web  http://localhost:8080"
	@echo "api  http://localhost:3000/api/properties"

down: ## Stop the stack and drop its volumes
	$(COMPOSE) down -v

logs: ## Follow the api and web logs
	$(COMPOSE) logs -f api web

ps: ## Show service status and health
	$(COMPOSE) ps

migrate: ## Apply pending migrations against DATABASE_URL
	DATABASE_URL=$(DATABASE_URL) PROPERTY_SOURCE=postgres npm run migrate

seed: ## Load the CSV catalogue into Postgres
	DATABASE_URL=$(DATABASE_URL) CSV_PATH=$(CSV_PATH) PROPERTY_SOURCE=postgres npm run seed

psql: ## Open a psql shell on the running database
	$(COMPOSE) exec postgres psql -U yaya -d yaya

smoke: ## Check the running stack answers on every endpoint that matters
	@set -e; \
	curl -fsS http://localhost:3000/health  > /dev/null && echo "  health  ok"; \
	curl -fsS http://localhost:3000/ready   > /dev/null && echo "  ready   ok"; \
	curl -fsS 'http://localhost:3000/api/properties?bedrooms=2&minPrice=800' > /dev/null && echo "  search  ok"; \
	curl -fsS http://localhost:8080/ > /dev/null && echo "  web     ok"

clean: ## Remove build output and coverage
	rm -rf apps/web/dist coverage
