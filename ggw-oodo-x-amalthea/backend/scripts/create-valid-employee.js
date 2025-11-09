/**
 * ============================================================================
 * Create Sample Employee User with Valid Email Script
 * ============================================================================
 * This script creates a sample employee user with a valid Gmail address
 * 
 * Credentials:
 *   Email: employee.test@gmail.com
 *   Password: employee123
 *   Role: team_member (Employee)
 *   Expected Redirect: /employee
 * ============================================================================
 */

const bcrypt = require('bcrypt');
const { query } = require('../config/database');

const SALT_ROUNDS = 12;

async function createSampleEmployee() {
    try {
        console.log('\n🔄 Creating sample employee user with valid email...\n');

        const employeeEmail = 'employee.test@gmail.com';

        // Delete existing employee@ggw.com if exists
        const deleteOld = await query(
            'DELETE FROM auth.users WHERE email = $1 RETURNING email',
            ['employee@ggw.com']
        );

        if (deleteOld.rows.length > 0) {
            console.log('✓ Removed old employee@ggw.com user');
        }

        // Check if new user already exists
        const existingUser = await query(
            'SELECT email FROM auth.users WHERE email = $1',
            [employeeEmail]
        );

        if (existingUser.rows.length > 0) {
            console.log(`⚠️  User ${employeeEmail} already exists!`);
            console.log('\nTo reset this user, delete them first:');
            console.log(`DELETE FROM auth.users WHERE email = '${employeeEmail}';\n`);
            process.exit(1);
        }

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
        const passwordHash = await bcrypt.hash('employee123', SALT_ROUNDS);

        // Create user
        const userResult = await query(`
            INSERT INTO auth.users (org_id, full_name, email, password_hash, is_active)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, email, full_name
        `, [
            orgId,
            'John Employee',
            employeeEmail,
            passwordHash,
            true
        ]);

        const user = userResult.rows[0];
        console.log('✓ Created user:', user.full_name);

        // Assign team_member role
        await query(`
            INSERT INTO auth.user_roles (org_id, user_id, role)
            VALUES ($1, $2, $3)
        `, [orgId, user.id, 'team_member']);

        console.log('✓ Assigned role: team_member');

        console.log('\n✅ Sample employee created successfully!\n');
        console.log('╔════════════════════════════════════════════════╗');
        console.log('║          SAMPLE EMPLOYEE CREDENTIALS           ║');
        console.log('╠════════════════════════════════════════════════╣');
        console.log('║ Email:    employee.test@gmail.com              ║');
        console.log('║ Password: employee123                          ║');
        console.log('║ Role:     Employee (team_member)               ║');
        console.log('║ Redirect: /employee                            ║');
        console.log('╚════════════════════════════════════════════════╝');
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating sample employee:', error.message);
        process.exit(1);
    }
}

// Run the script
createSampleEmployee();
