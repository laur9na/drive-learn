#!/usr/bin/env node

/**
 * Apply database migration directly to Supabase
 * This reads the migration file and executes it using the Supabase service role key
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nGet your service role key from:');
  console.error('https://supabase.com/dashboard/project/kwtzrgebyrpbawpdsrwd/settings/api');
  console.error('\nThen add to .env:');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('📦 Loading migration file...');

  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260118000000_create_drivelearn_tables.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('🚀 Applying migration to Supabase...');
  console.log(`   URL: ${SUPABASE_URL}`);

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');

    // Verify tables were created
    console.log('\n🔍 Verifying tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['classes', 'study_materials', 'generated_questions', 'commute_sessions', 'session_responses']);

    if (tablesError) {
      console.log('⚠️  Could not verify tables (this is okay)');
    } else {
      console.log('Tables created:', tables?.map(t => t.table_name).join(', '));
    }

    console.log('\n✨ All done! You can now use the app.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

applyMigration();
