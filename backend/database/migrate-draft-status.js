/**
 * Migration script to add 'draft' status to finance.expense_status enum
 */

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Connected to database...');
    console.log('Adding "draft" to finance.expense_status enum...');
    
    // Check if 'draft' already exists
    const checkQuery = `
      SELECT EXISTS (
        SELECT 1 
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'expense_status' 
        AND e.enumlabel = 'draft'
      ) as exists;
    `;
    
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows[0].exists) {
      console.log('✓ "draft" status already exists in finance.expense_status enum');
    } else {
      // Add the new enum value
      await client.query("ALTER TYPE finance.expense_status ADD VALUE 'draft'");
      console.log('✓ Successfully added "draft" to finance.expense_status enum');
    }
    
    // Verify it was added
    const verifyQuery = `
      SELECT enumlabel 
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'expense_status'
      ORDER BY enumsortorder;
    `;
    
    const result = await client.query(verifyQuery);
    console.log('\nCurrent finance.expense_status values:');
    result.rows.forEach(row => console.log('  -', row.enumlabel));
    
  } catch (error) {
    console.error('Error during migration:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => {
    console.log('\n✓ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  });
