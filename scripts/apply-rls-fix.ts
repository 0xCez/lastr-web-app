/**
 * Apply RLS policy fixes directly via service role
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyRLSFix() {
  console.log('🔧 Applying RLS policy fixes...\n');

  // We'll execute each SQL statement separately
  const statements = [
    // ======================
    // ANALYTICS TABLE
    // ======================

    // Drop existing policies
    `DROP POLICY IF EXISTS "Users can view analytics for own posts" ON analytics`,
    `DROP POLICY IF EXISTS "Admins can view all analytics" ON analytics`,
    `DROP POLICY IF EXISTS "Admins can insert analytics" ON analytics`,
    `DROP POLICY IF EXISTS "Service role can insert analytics" ON analytics`,
    `DROP POLICY IF EXISTS "analytics_select_own" ON analytics`,
    `DROP POLICY IF EXISTS "analytics_select_admin" ON analytics`,
    `DROP POLICY IF EXISTS "analytics_insert_admin" ON analytics`,
    `DROP POLICY IF EXISTS "analytics_update_admin" ON analytics`,
    `DROP POLICY IF EXISTS "analytics_delete_admin" ON analytics`,

    // Create new policies for analytics
    `CREATE POLICY "analytics_select_own" ON analytics FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = analytics.post_id AND posts.submitted_by = auth.uid()))`,
    `CREATE POLICY "analytics_select_admin" ON analytics FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))`,
    `CREATE POLICY "analytics_insert_admin" ON analytics FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))`,
    `CREATE POLICY "analytics_update_admin" ON analytics FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))`,
    `CREATE POLICY "analytics_delete_admin" ON analytics FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))`,

    // ======================
    // CPM_POST_BREAKDOWN TABLE
    // ======================

    // Drop existing policies
    `DROP POLICY IF EXISTS "Users can view own CPM breakdown" ON cpm_post_breakdown`,
    `DROP POLICY IF EXISTS "Admins can view all CPM breakdown" ON cpm_post_breakdown`,
    `DROP POLICY IF EXISTS "Admins can manage CPM breakdown" ON cpm_post_breakdown`,
    `DROP POLICY IF EXISTS "cpm_select_own" ON cpm_post_breakdown`,
    `DROP POLICY IF EXISTS "cpm_select_admin" ON cpm_post_breakdown`,
    `DROP POLICY IF EXISTS "cpm_insert_admin" ON cpm_post_breakdown`,
    `DROP POLICY IF EXISTS "cpm_update_admin" ON cpm_post_breakdown`,
    `DROP POLICY IF EXISTS "cpm_delete_admin" ON cpm_post_breakdown`,

    // Create new policies for cpm_post_breakdown
    `CREATE POLICY "cpm_select_own" ON cpm_post_breakdown FOR SELECT TO authenticated USING (user_id = auth.uid())`,
    `CREATE POLICY "cpm_select_admin" ON cpm_post_breakdown FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))`,
    `CREATE POLICY "cpm_insert_admin" ON cpm_post_breakdown FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))`,
    `CREATE POLICY "cpm_update_admin" ON cpm_post_breakdown FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))`,
    `CREATE POLICY "cpm_delete_admin" ON cpm_post_breakdown FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))`,
  ];

  let success = 0;
  let failed = 0;

  for (const sql of statements) {
    const shortSql = sql.length > 80 ? sql.slice(0, 77) + '...' : sql;

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try alternative approach - direct query
      // Note: This may not work depending on Supabase setup
      console.log(`⚠️  ${shortSql}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    } else {
      console.log(`✅ ${shortSql}`);
      success++;
    }
  }

  console.log(`\n📊 Results: ${success} succeeded, ${failed} failed`);

  if (failed > 0) {
    console.log(`\n⚠️  Some policies couldn't be applied via RPC.`);
    console.log(`   You may need to run the SQL directly in Supabase Dashboard.`);
    console.log(`   Go to: SQL Editor → New Query → Paste the migration SQL`);
  }
}

applyRLSFix().catch(console.error);
