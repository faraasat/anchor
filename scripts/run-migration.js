#!/usr/bin/env node
/**
 * Migration Script - Runs SQL migration against remote Supabase database
 * Usage: node scripts/run-migration.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Starting migration...\n');
  
  // Read migration SQL file
  const migrationPath = path.join(__dirname, '../supabase/migrations/critical_missing_tables.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('📄 Read migration file:', migrationPath);
  console.log('📦 SQL size:', (sql.length / 1024).toFixed(2), 'KB\n');

  // Execute SQL via Supabase REST API
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  
  console.log('🔄 Executing migration on remote database...');
  console.log('🌐 Database:', SUPABASE_URL);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      // If the exec_sql function doesn't exist, we need to execute via SQL editor
      console.log('⚠️  Cannot run via API. You need to run this manually in the Supabase SQL Editor.');
      console.log('\n📋 Instructions:');
      console.log('1. Go to: ' + SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase.co', '/sql/new'));
      console.log('2. Copy ALL content from: supabase/migrations/critical_missing_tables.sql');
      console.log('3. Paste into SQL Editor');
      console.log('4. Click RUN\n');
      
      // Also try direct SQL execution endpoint
      console.log('🔄 Trying alternative method...\n');
      
      const sqlUrl = `${SUPABASE_URL}/rest/v1/`;
      const response2 = await fetch(sqlUrl.replace('/rest/v1/', '') + '/auth/v1/health', {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
        },
      });
      
      if (response2.ok) {
        console.log('✅ Supabase connection successful!');
        console.log('📝 Please run the migration manually as shown above.\n');
      } else {
        console.error('❌ Cannot connect to Supabase. Check your credentials.');
      }
      
      return;
    }

    const result = await response.json();
    console.log('✅ Migration executed successfully!');
    console.log('📊 Result:', result);
    
  } catch (error) {
    console.error('❌ Error executing migration:', error.message);
    console.log('\n📋 Manual migration required:');
    console.log('1. Go to: ' + SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase.co', '/sql/new'));
    console.log('2. Copy content from: supabase/migrations/critical_missing_tables.sql');
    console.log('3. Paste and run in SQL Editor\n');
  }
}

// Run migration
runMigration().catch(console.error);
