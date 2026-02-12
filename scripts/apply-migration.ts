#!/usr/bin/env tsx
/**
 * TypeScript Migration Script - Applies migration to remote Supabase
 * Run: npx tsx scripts/apply-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Add to .env: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
  console.log('🔍 Checking existing tables...\n');
  
  const tables = ['profiles', 'households', 'household_members', 'nudges', 'anchor_points', 'reminders', 'user_subscriptions'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    
    if (error) {
      console.log(`❌ ${table}: NOT FOUND`);
    } else {
      console.log(`✅ ${table}: EXISTS`);
    }
  }
  
  console.log('\n');
}

async function applyMigration() {
  console.log('🚀 Migration Script for Remote Supabase Database\n');
  
  await checkTables();
  
  const migrationPath = path.join(__dirname, '../supabase/migrations/critical_missing_tables.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('📄 Migration file loaded');
  console.log('📦 Size:', (sql.length / 1024).toFixed(2), 'KB');
  console.log('🌐 Target:', SUPABASE_URL);
  console.log('\n⚠️  IMPORTANT: The Supabase JS client cannot execute raw SQL migrations.');
  console.log('You must run this migration in the Supabase Dashboard SQL Editor.\n');
  
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
  
  console.log('📋 STEPS TO RUN MIGRATION:\n');
  console.log('1. Open SQL Editor:');
  console.log(`   ${sqlEditorUrl}\n`);
  console.log('2. Copy the entire contents of:');
  console.log(`   ${migrationPath}\n`);
  console.log('3. Paste into the SQL Editor');
  console.log('4. Click "RUN" (or press Cmd+Enter)\n');
  console.log('5. Verify success - you should see:');
  console.log('   "Success. No rows returned"\n');
  console.log('6. Re-run this script to verify tables were created:\n');
  console.log('   npx tsx scripts/apply-migration.ts\n');
  
  // Try to open in browser
  const { execSync } = require('child_process');
  try {
    console.log('🌐 Opening SQL Editor in browser...\n');
    execSync(`open "${sqlEditorUrl}"`, { stdio: 'ignore' });
  } catch (e) {
    // Browser open failed, ignore
  }
}

applyMigration().catch(console.error);
