#!/usr/bin/env tsx
/**
 * Direct Migration Applier - Uses Supabase Management API
 * Run: npx tsx scripts/migrate-now.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

async function executeSQLDirect() {
  console.log('🚀 Attempting direct SQL execution...\n');
  
  const migrationPath = path.join(__dirname, '../supabase/migrations/critical_missing_tables.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  // Extract project ref from URL
  const match = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) {
    console.error('❌ Invalid Supabase URL format');
    return false;
  }
  
  const projectRef = match[1];
  
  // Try to execute via PostgreSQL REST endpoint
  console.log('📡 Connecting to Supabase...');
  console.log('🆔 Project:', projectRef);
  
  // Split SQL into individual statements and execute them
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`📝 Found ${statements.length} SQL statements\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    // Skip comments
    if (statement.trim().startsWith('--')) continue;
    
    try {
      // Execute via PostgREST query endpoint
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ sql: statement })
      });
      
      if (response.ok) {
        successCount++;
        process.stdout.write('.');
      } else {
        errorCount++;
        // This is expected - PostgREST doesn't support raw SQL execution
        break;
      }
    } catch (error) {
      break;
    }
  }
  
  if (successCount > 0) {
    console.log(`\n\n✅ Executed ${successCount} statements successfully!`);
    return true;
  }
  
  return false;
}

async function showManualInstructions() {
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
  
  console.log('\n⚠️  Automated migration not available with current credentials.');
  console.log('📋 Please follow these manual steps:\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('STEP 1: Open this URL in your browser:');
  console.log(`\n  🌐 ${sqlEditorUrl}\n`);
  console.log('STEP 2: Copy the ENTIRE file contents:');
  console.log(`\n  📄 supabase/migrations/critical_missing_tables.sql\n`);
  console.log('STEP 3: Paste into the SQL Editor window');
  console.log('\nSTEP 4: Click the green "RUN" button (bottom right)');
  console.log('\nSTEP 5: Wait for "Success. No rows returned" message');
  console.log('\nSTEP 6: Verify tables were created by running:');
  console.log('\n  npx tsx scripts/apply-migration.ts\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Open browser
  const { execSync } = require('child_process');
  try {
    console.log('🌐 Opening SQL Editor...\n');
    execSync(`open "${sqlEditorUrl}"`, { stdio: 'ignore' });
  } catch (e) {
    console.log('💡 Manually open: ' + sqlEditorUrl + '\n');
  }
  
  // Also copy SQL to clipboard
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/critical_missing_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    execSync(`echo "${sql.replace(/"/g, '\\"')}" | pbcopy`, { stdio: 'ignore' });
    console.log('✅ SQL copied to clipboard! Just paste (Cmd+V) in the editor.\n');
  } catch (e) {
    // Clipboard copy failed, that's ok
  }
}

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   SUPABASE MIGRATION TOOL              ║');
  console.log('╚════════════════════════════════════════╝\n');
  
  const success = await executeSQLDirect();
  
  if (!success) {
    await showManualInstructions();
  } else {
    console.log('\n✅ Migration completed! Restart your app:\n');
    console.log('  npx expo start -c\n');
  }
}

main().catch(console.error);
