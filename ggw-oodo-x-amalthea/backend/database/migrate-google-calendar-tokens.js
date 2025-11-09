/**
 * Migration script to create google_calendar_tokens table
 */

const { pool } = require('../config/database');

async function migrate() {
    const client = await pool.connect();
    
    try {
        console.log('Starting migration: google_calendar_tokens table...');
        
        // Create the table
        await client.query(`
            CREATE TABLE IF NOT EXISTS auth.google_calendar_tokens (
                user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                access_token TEXT NOT NULL,
                refresh_token TEXT,
                expiry_date TIMESTAMPTZ,
                token_type TEXT DEFAULT 'Bearer',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        
        console.log('✓ Created google_calendar_tokens table');
        
        // Create index
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user_id 
            ON auth.google_calendar_tokens(user_id);
        `);
        
        console.log('✓ Created index on user_id');
        
        // Add comment
        await client.query(`
            COMMENT ON TABLE auth.google_calendar_tokens IS 'Stores Google Calendar OAuth tokens for each user';
        `);
        
        console.log('✓ Migration completed successfully');
        
    } catch (error) {
        console.error('✗ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
migrate()
    .then(() => {
        console.log('Migration finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration error:', error);
        process.exit(1);
    });
