/**
 * ============================================================================
 * Create Admin User Script
 * ============================================================================
 * This script creates the admin user with proper password hash
 * 
 * Credentials:
 *   Email: admin@ggw.com
 *   Password: admin123
 *   Role: admin
 * ============================================================================
 */

const bcrypt = require('bcrypt');
const { query } = require('../config/database');

const SALT_ROUNDS = 12;

async function createAdminUser() {
    try {
        console.log('\n🔄 Creating admin user...\n');

        // Check if user already exists
        const existingUser = await query(
            'SELECT email FROM auth.users WHERE email = $1',
            ['admin@ggw.com']
        );

        if (existingUser.rows.length > 0) {
            console.log('⚠️  User admin@ggw.com already exists!');
            console.log('Updating password hash...');
            
            // Hash password
            const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
            
            // Update password hash
            await query(
                'UPDATE auth.users SET password_hash = $1 WHERE email = $2',
                [passwordHash, 'admin@ggw.com']
            );
            
            console.log('✓ Password hash updated successfully!\n');
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
            const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);

            // Create user
            const userResult = await query(`
                INSERT INTO auth.users (id, org_id, full_name, email, password_hash, is_active, created_at, updated_at)
                VALUES ('00000000-0000-0000-0000-000000000001'::uuid, $1, $2, $3, $4, $5, NOW(), NOW())
                RETURNING id, email, full_name
            `, [
                orgId,
                'Admin User',
                'admin@ggw.com',
                passwordHash,
                true
            ]);

            const user = userResult.rows[0];
            console.log('✓ Created user:', user.full_name);

            // Assign admin role
            await query(`
                INSERT INTO auth.user_roles (org_id, user_id, role)
                VALUES ($1, $2, $3)
                ON CONFLICT (org_id, user_id, role) DO NOTHING
            `, [orgId, user.id, 'admin']);

            console.log('✓ Assigned role: admin');
        }

        console.log('\n✅ Admin user ready!\n');
        console.log('╔════════════════════════════════════════════════╗');
        console.log('║            ADMIN CREDENTIALS                  ║');
        console.log('╠════════════════════════════════════════════════╣');
        console.log('║ Email:    admin@ggw.com                       ║');
        console.log('║ Password: admin123                             ║');
        console.log('║ Role:     Admin                                ║');
        console.log('╚════════════════════════════════════════════════╝');
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        process.exit(1);
    }
}

// Run the script
createAdminUser();

