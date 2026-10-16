.PHONY: setup dev typecheck build lint test db-reset import-candidates
setup:
	npm install
	@echo "Copy .env.example to .env.local and configure Supabase"
dev:
	npm run dev
typecheck:
	npm run typecheck
build:
	npm run build
lint:
	npm run lint
test:
	npm test
db-reset:
	npm run db:reset
import-candidates:
	npm run import:candidates
