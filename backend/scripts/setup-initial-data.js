/**
 * Setup Initial Data Script
 * Run this to create organization and sample users
 */

const { pool } = require('../config/database');
require('dotenv').config();

async function setupInitialData() {
    const client = await pool.connect();
    
    try {
        console.log('🔧 Setting up initial data...\n');

        // Create default organization
        console.log('📁 Creating default organization...');
        const orgResult = await client.query(`
            INSERT INTO auth.orgs (name, slug, base_currency, default_timezone, is_active)
            VALUES ('Default Organization', 'default-org', 'USD', 'UTC', true)
            ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
            RETURNING *
        `);
        const org = orgResult.rows[0];
        console.log(`✅ Organization created: ${org.name} (${org.id})`);

        // Create sample users
        console.log('\n👥 Creating sample users...');
        const users = [
            { email: 'gaurav@example.com', name: 'Gaurav' },
            { email: 'drashti@example.com', name: 'Drashti' }
        ];

        for (const user of users) {
            const userResult = await client.query(`
                INSERT INTO auth.users (org_id, email, full_name, email_verified_at, is_active)
                VALUES ($1, $2, $3, NOW(), true)
                ON CONFLICT (org_id, email) DO UPDATE SET full_name = EXCLUDED.full_name
                RETURNING *
            `, [org.id, user.email, user.name]);
            
            console.log(`✅ User created: ${userResult.rows[0].full_name} (${userResult.rows[0].email})`);
        }

        // Verify setup
        console.log('\n📊 Verifying setup...');
        const verifyOrg = await client.query(`
            SELECT name, slug, base_currency FROM auth.orgs WHERE slug = 'default-org'
        `);
        console.log('\nOrganization:', verifyOrg.rows[0]);

        const verifyUsers = await client.query(`
            SELECT email, full_name, is_active FROM auth.users WHERE org_id = $1
        `, [org.id]);
        console.log('\nUsers:', verifyUsers.rows);

        console.log('\n✅ Initial setup completed successfully!');
        console.log('\n🚀 You can now:');
        console.log('   1. Create projects via API');
        console.log('   2. Assign managers by email (gaurav@example.com or drashti@example.com)');
        console.log('   3. Start using the projects page in your frontend\n');

    } catch (error) {
        console.error('❌ Error setting up initial data:', error.message);
        console.error(error);
    } finally {
        client.release();
        await pool.end();
    }
}

setupInitialData();
