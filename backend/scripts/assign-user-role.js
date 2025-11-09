/**
 * ============================================================================
 * User Role Assignment Script
 * ============================================================================
 * This script helps you assign or change roles for users in the database
 * 
 * Usage:
 *   node scripts/assign-user-role.js <email> <role>
 * 
 * Examples:
 *   node scripts/assign-user-role.js manager@example.com project_manager
 *   node scripts/assign-user-role.js employee@example.com team_member
 *   node scripts/assign-user-role.js admin@example.com admin
 *   node scripts/assign-user-role.js finance@example.com finance
 * 
 * Available roles:
 *   - admin
 *   - project_manager
 *   - team_member (default for employees)
 *   - finance
 * ============================================================================
 */

const { query } = require('../config/database');

// Valid roles
const VALID_ROLES = ['admin', 'project_manager', 'team_member', 'finance'];

async function assignUserRole(email, role) {
    try {
        // Validate role
        if (!VALID_ROLES.includes(role)) {
            console.error(`❌ Invalid role: ${role}`);
            console.log(`Valid roles are: ${VALID_ROLES.join(', ')}`);
            process.exit(1);
        }

        // Check if user exists
        const userResult = await query(
            'SELECT id, org_id, email, full_name FROM auth.users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (userResult.rows.length === 0) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        const user = userResult.rows[0];
        console.log(`\n📧 User found: ${user.full_name} (${user.email})`);

        // Check existing role
        const existingRoleResult = await query(
            'SELECT role FROM auth.user_roles WHERE user_id = $1',
            [user.id]
        );

        if (existingRoleResult.rows.length > 0) {
            const oldRole = existingRoleResult.rows[0].role;
            console.log(`🔄 Current role: ${oldRole}`);
            
            // Remove existing role
            await query(
                'DELETE FROM auth.user_roles WHERE user_id = $1',
                [user.id]
            );
            console.log(`✓ Removed old role: ${oldRole}`);
        } else {
            console.log(`ℹ️  No existing role found`);
        }

        // Assign new role
        await query(
            'INSERT INTO auth.user_roles (org_id, user_id, role) VALUES ($1, $2, $3)',
            [user.org_id, user.id, role]
        );

        console.log(`✓ Assigned new role: ${role}`);
        console.log(`\n✅ Success! User ${email} is now a ${role}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error assigning role:', error.message);
        process.exit(1);
    }
}

async function listUsers() {
    try {
        const result = await query(`
            SELECT 
                u.email,
                u.full_name,
                COALESCE(ur.role::text, 'No Role') as role,
                u.is_active
            FROM auth.users u
            LEFT JOIN auth.user_roles ur ON u.id = ur.user_id
            ORDER BY u.email
        `);

        console.log('\n📋 All Users and Their Roles:\n');
        console.log('Email'.padEnd(30), 'Name'.padEnd(25), 'Role'.padEnd(20), 'Active');
        console.log('-'.repeat(100));
        
        result.rows.forEach(user => {
            console.log(
                user.email.padEnd(30),
                (user.full_name || 'N/A').padEnd(25),
                user.role.padEnd(20),
                user.is_active ? '✓' : '✗'
            );
        });
        
        console.log('\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error listing users:', error.message);
        process.exit(1);
    }
}

async function assignDefaultRoles() {
    try {
        console.log('\n🔄 Assigning default role (team_member) to all users without a role...\n');

        const result = await query(`
            INSERT INTO auth.user_roles (org_id, user_id, role)
            SELECT u.org_id, u.id, 'team_member'::auth.role_type
            FROM auth.users u
            LEFT JOIN auth.user_roles ur ON u.id = ur.user_id
            WHERE ur.user_id IS NULL
            RETURNING (SELECT email FROM auth.users WHERE id = user_id) as email
        `);

        if (result.rows.length === 0) {
            console.log('✓ All users already have roles assigned\n');
        } else {
            console.log(`✓ Assigned team_member role to ${result.rows.length} user(s):`);
            result.rows.forEach(row => {
                console.log(`  - ${row.email}`);
            });
            console.log('\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error assigning default roles:', error.message);
        process.exit(1);
    }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--list' || args[0] === '-l') {
    // List all users
    listUsers();
} else if (args[0] === '--assign-defaults' || args[0] === '-d') {
    // Assign default roles to users without roles
    assignDefaultRoles();
} else if (args.length === 2) {
    // Assign specific role to user
    const [email, role] = args;
    assignUserRole(email, role);
} else {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                    User Role Assignment Script                     ║
╚════════════════════════════════════════════════════════════════════╝

Usage:
  node scripts/assign-user-role.js <email> <role>
  node scripts/assign-user-role.js --list
  node scripts/assign-user-role.js --assign-defaults

Examples:
  node scripts/assign-user-role.js manager@example.com project_manager
  node scripts/assign-user-role.js employee@example.com team_member
  node scripts/assign-user-role.js --list
  node scripts/assign-user-role.js --assign-defaults

Available roles:
  - admin              (Full system access)
  - project_manager    (Can manage projects, redirect to /app)
  - team_member        (Employee, redirect to /employee)
  - finance            (Finance role, redirect to /employee)

Options:
  --list, -l           List all users and their roles
  --assign-defaults    Assign 'team_member' role to all users without a role
`);
    process.exit(1);
}
