# KinFit Production Deployment

## Prerequisites

- Production MongoDB URI (`MONGODB_URI`) configured in `.env.production` or your deployment platform
- `.env.production` is gitignored; create it locally for running migrations against prod

## Migrations

### Migrate Legacy Set Entries

**When:** Before deploying the setEntries refactor that removes legacy top-level fields.

**Purpose:** Converts strength exercises with only `weightValue`, `weightType`, `reps`, `sets` at the top level into `setEntries: [{ weightValue, weightType, reps, sets }]`.

**Run locally against production:**

```bash
# Option 1: From project root (uses MONGODB_URI from env)
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/kinfit" npm run migrate-legacy-set-entries

# Option 2: With .env.production
# Ensure .env.production contains MONGODB_URI pointing to prod
npm run migrate-legacy-set-entries
```

**Run via VS Code:**

1. Create `.env.production` in the project root with your prod `MONGODB_URI`
2. Run → Start Debugging → select **"PROD: Migrate Legacy Set Entries"**

**Run from back-end:**

```bash
cd back-end
MONGODB_URI="<your-prod-uri>" npm run migrate-legacy-set-entries
```

**Idempotent:** Safe to run multiple times; exercises that already have `setEntries` are skipped.

## Vercel

The frontend and API deploy via Vercel. Configure environment variables in the Vercel project dashboard (`MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`). Migrations are **not** run automatically; run them manually before deploying schema/API changes that depend on migrated data.
