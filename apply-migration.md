# Apply DriveLearn Database Migration

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/jrxfdintwiykyztqnlrw/sql/new

2. Copy the entire SQL from: `supabase/migrations/20260118000000_create_drivelearn_tables.sql`

3. Paste it into the SQL Editor

4. Click "Run" button

5. You should see "Success. No rows returned" - this is normal!

6. Verify tables were created by running this query:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('classes', 'study_materials', 'generated_questions', 'commute_sessions', 'session_responses')
ORDER BY table_name;
```

You should see all 5 tables listed.

## Option 2: Using Node Script (if you prefer)

Run: `npm run migrate` (if we set it up)

## After Migration

1. Refresh your app at http://localhost:5173
2. Sign in with your account
3. Try creating a class
4. Try clicking "View Class"

Everything should work now!
