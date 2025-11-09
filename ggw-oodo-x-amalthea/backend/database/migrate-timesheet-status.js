/**
 * Migration Script: Add status column to timesheets table
 * 
 * This script adds a proper status enum column to distinguish between
 * pending, approved, and rejected timesheets.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'user_management_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting timesheet status migration...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'add-timesheet-status.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the migration
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the changes
    const result = await client.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM project.timesheets
      GROUP BY status
      ORDER BY status
    `);
    
    console.log('\n📊 Timesheet status breakdown:');
    result.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✨ All done! Please restart your backend server to use the new status column.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
