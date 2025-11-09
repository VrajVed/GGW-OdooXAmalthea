/**
 * ============================================================================
 * Create Project Manager User Script
 * ============================================================================
 * This script creates a sample project manager user for testing
 * 
 * Credentials:
 *   Email: manager@ggw.com
 *   Password: manager123
 *   Role: project_manager (Project Manager)
 *   Expected Redirect: /dashboard/pm
 * ============================================================================
 */

const bcrypt = require('bcrypt');
const { query } = require('../config/database');

const SALT_ROUNDS = 12;

async function createProjectManager() {
    try {
        console.log('\n🔄 Creating project manager user...\n');

        // Check if user already exists
        const existingUser = await query(
            'SELECT email FROM auth.users WHERE email = $1',
            ['manager@ggw.com']
        );

        if (existingUser.rows.length > 0) {
            console.log('⚠️  User manager@ggw.com already exists!');
            console.log('Updating password and role...');
            
            // Hash password
            const passwordHash = await bcrypt.hash('manager123', SALT_ROUNDS);
            
            // Update password hash
            await query(
                'UPDATE auth.users SET password_hash = $1 WHERE email = $2',
                [passwordHash, 'manager@ggw.com']
            );
            
            // Get user ID and org ID
            const userResult = await query(
                'SELECT id, org_id FROM auth.users WHERE email = $1',
                ['manager@ggw.com']
            );
            const userId = userResult.rows[0].id;
            const orgId = userResult.rows[0].org_id;
            
            // Remove existing roles and assign project_manager role
            await query(
                'DELETE FROM auth.user_roles WHERE user_id = $1',
                [userId]
            );
            
            await query(`
                INSERT INTO auth.user_roles (org_id, user_id, role)
                VALUES ($1, $2, $3)
                ON CONFLICT (org_id, user_id, role) DO NOTHING
            `, [orgId, userId, 'project_manager']);
            
            console.log('✓ Password hash and role updated successfully!\n');
        } else {
            // Get or create organization
            let orgId;
            const orgResult = await query(
                'SELECT id FROM auth.orgs WHERE id = $1',
                ['00000000-0000-0000-0000-000000000001']
            );

            if (orgResult.rows.length > 0) {
                orgId = orgResult.rows[0].id;
            } else {
                // Create default org
                const createOrgResult = await query(`
                    INSERT INTO auth.orgs (id, name, slug, base_currency, default_timezone, created_at, updated_at)
                    VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'GGW Organization', 'ggw-org', 'INR', 'Asia/Kolkata', NOW(), NOW())
                    RETURNING id
                `);
                orgId = createOrgResult.rows[0].id;
                console.log('✓ Created default organization');
            }

            // Hash password
            const passwordHash = await bcrypt.hash('manager123', SALT_ROUNDS);

            // Create user
            const userResult = await query(`
                INSERT INTO auth.users (org_id, full_name, email, password_hash, is_active, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                RETURNING id, email, full_name
            `, [
                orgId,
                'Project Manager',
                'manager@ggw.com',
                passwordHash,
                true
            ]);

            const user = userResult.rows[0];
            console.log('✓ Created user:', user.full_name);

            // Assign project_manager role
            await query(`
                INSERT INTO auth.user_roles (org_id, user_id, role)
                VALUES ($1, $2, $3)
                ON CONFLICT (org_id, user_id, role) DO NOTHING
            `, [orgId, user.id, 'project_manager']);

            console.log('✓ Assigned role: project_manager');
        }

        console.log('\n✅ Project manager user ready!\n');
        console.log('╔════════════════════════════════════════════════╗');
        console.log('║       PROJECT MANAGER CREDENTIALS            ║');
        console.log('╠════════════════════════════════════════════════╣');
        console.log('║ Email:    manager@ggw.com                     ║');
        console.log('║ Password: manager123                          ║');
        console.log('║ Role:     Project Manager                     ║');
        console.log('║ Redirect: /dashboard/pm                        ║');
        console.log('╚════════════════════════════════════════════════╝');
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating project manager:', error.message);
        process.exit(1);
    }
}

// Run the script
createProjectManager();

