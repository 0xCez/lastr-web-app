# Claude Code Rules for Creator Platform

## Golden Rules

### 1. NEVER Edit Code Based on Assumptions
- Always READ the actual code before suggesting changes
- Always VERIFY the current state before proposing fixes
- If unsure, ASK or INVESTIGATE first
- Run audits to confirm issues are real before fixing

### 2. Investigate Before Acting
- Before any fix: read the relevant files
- Before any migration: check how tables are actually used
- Before any refactor: search for all usages in the codebase
- Use the Task tool with Explore agent for thorough investigation

### 3. Understand Intent, Not Just Structure
- A "missing" FK might be intentional (e.g., queue tables)
- A "duplicate" policy might serve different purposes
- Ask: "Why might this have been designed this way?"

---

## Database Rules

### Migrations
- Always use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Always use `DROP ... IF EXISTS` before `CREATE` for policies
- Test migrations can be re-run safely
- Document the PURPOSE of each migration in comments

### Foreign Keys
- Queue/log tables may intentionally OMIT FKs to preserve history
- Audit columns (approved_by, reviewed_by) use RESTRICT intentionally
- Always check how a table is used before adding/changing FKs

### RLS Policies
- Service role key bypasses RLS (correct for edge functions)
- Check for duplicate policies before adding new ones
- Name policies consistently: `{table}_{role}_{action}`

---

## Frontend Rules

### Date Handling
- ALWAYS use UTC for date calculations
- Use helpers from `src/utils/dateUtils.ts`:
  - `getUTCDayOfWeek()` not `getDay()`
  - `getUTCMonth()` not `getMonth()`
  - `toUTCMidnight()` for date boundaries
  - `getCurrentWeekBoundaries()` for week ranges
- NEVER use `new Date().getMonth()` or `new Date().getDay()` directly

### Constants
- All business logic values go in `src/constants/contracts.ts`
- All config values go in `src/config/constants.ts`
- NEVER hardcode: CPM rates, caps, thresholds, targets
- Import constants, don't duplicate values

### Hooks
- Avoid N+1 queries - fetch all data then filter client-side
- Use proper TypeScript types, avoid `any`
- Handle loading and error states

---

## Edge Functions Rules

### Deployment
- **ALWAYS deploy after updating edge functions**: `export PATH="$HOME/.bun/bin:$PATH" && bunx supabase functions deploy <function-name> --no-verify-jwt`
- Git push alone does NOT deploy edge functions - you must run the deploy command
- Example: `bunx supabase functions deploy generate-slideshow --no-verify-jwt`

### Secrets
- NEVER hardcode API keys or tokens
- Use `Deno.env.get('SECRET_NAME')`
- Validate secrets exist before using them

### Database Access
- Use service role key for backend operations
- Always handle errors from Supabase queries
- Log meaningful error messages

### Apify Integration
- Use key rotation via `APIFY_API_TOKENS` (comma-separated)
- Handle 402 (quota) and 429 (rate limit) errors
- Add failed posts to `failed_posts_queue` for retry

---

## CPM System Rules

### Configuration (DO NOT CHANGE WITHOUT DISCUSSION)
- CPM Rate: $1.50 per 1000 views
- CPM Window: 28 days (4 weeks)
- Post Cap: $350 per post
- User Monthly Cap: $5,000 per user per month
- Weekly Post Target: 12 posts (Monday-Sunday)

### Week Definitions
- UGC Creator weeks: Monday-Sunday
- Weekly Recap: Friday-Thursday

---

## Before Making Changes

### Checklist
1. [ ] Did I READ the actual code first?
2. [ ] Did I VERIFY this is a real issue?
3. [ ] Did I CHECK how this code is used elsewhere?
4. [ ] Did I UNDERSTAND why it was designed this way?
5. [ ] Will my change BREAK any existing functionality?
6. [ ] Is this change NECESSARY or just "nice to have"?

### When in Doubt
- Ask the user for clarification
- Run a targeted audit on the specific area
- Check git history for context on why code exists
- Look for comments explaining design decisions

---

## File Locations

| Purpose | Location |
|---------|----------|
| Contract constants | `src/constants/contracts.ts` |
| App config | `src/config/constants.ts` |
| Date utilities | `src/utils/dateUtils.ts` |
| Database types | `src/integrations/supabase/types/database.types.ts` |
| Migrations | `supabase/migrations/` |
| Edge functions | `supabase/functions/` |
| React hooks | `src/hooks/` |

---

## Naming Conventions

### Database
- Tables: `snake_case` plural (e.g., `cpm_post_breakdown`)
- Columns: `snake_case` (e.g., `created_at`, `user_id`)
- Indexes: `idx_{table}_{columns}` (e.g., `idx_posts_status`)
- Policies: `{description}` (e.g., `Users can read own profile`)

### TypeScript
- Files: `camelCase.ts` or `kebab-case.ts`
- Hooks: `use{Name}.ts` (e.g., `useDashboardAnalytics.ts`)
- Components: `PascalCase.tsx`
- Constants: `SCREAMING_SNAKE_CASE`

---

## Testing Changes

Before committing:
1. Verify the app builds: `npm run build`
2. Check for TypeScript errors
3. Test the specific feature you changed
4. For migrations: verify they're idempotent (can run twice)
