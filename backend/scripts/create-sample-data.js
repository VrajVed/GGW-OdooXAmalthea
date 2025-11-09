/**
 * ============================================================================
 * Create Sample Projects, Tasks, and Expenses
 * ============================================================================
 * This script creates comprehensive test data for the application:
 * - Projects managed by the project manager
 * - Tasks assigned to both manager and employee
 * - Expenses submitted by the employee
 * - Timesheets for both users
 * ============================================================================
 */

const { query } = require('../config/database');

async function createSampleData() {
    try {
        console.log('\n🔄 Creating sample projects, tasks, and expenses...\n');

        // Get user IDs
        const usersResult = await query(`
            SELECT id, email, full_name FROM auth.users 
            WHERE email IN ('darshanmved@gmail.com', 'employee.test@gmail.com')
        `);

        if (usersResult.rows.length < 2) {
            console.error('❌ Required users not found. Please ensure both project manager and employee exist.');
            process.exit(1);
        }

        const manager = usersResult.rows.find(u => u.email === 'darshanmved@gmail.com');
        const employee = usersResult.rows.find(u => u.email === 'employee.test@gmail.com');

        console.log('✓ Found users:');
        console.log(`  - Manager: ${manager.full_name} (${manager.email})`);
        console.log(`  - Employee: ${employee.full_name} (${employee.email})\n`);

        // Get org ID
        const orgResult = await query('SELECT id FROM auth.orgs LIMIT 1');
        const orgId = orgResult.rows[0].id;

        // ========================================
        // Create Sample Projects
        // ========================================
        console.log('📁 Creating projects...');

        const projects = [
            {
                code: 'WEB-2024-001',
                name: 'Website Redesign',
                description: 'Complete redesign of company website with modern UI/UX and responsive design',
                status: 'in_progress',
                progress: 65,
                start_date: '2024-11-01',
                end_date: '2024-12-15',
                budget: 150000,
                tags: ['web', 'design', 'high-priority']
            },
            {
                code: 'MOB-2024-002',
                name: 'Mobile App Development',
                description: 'Native mobile application for iOS and Android platforms',
                status: 'in_progress',
                progress: 40,
                start_date: '2024-10-15',
                end_date: '2025-01-30',
                budget: 300000,
                tags: ['mobile', 'ios', 'android']
            },
            {
                code: 'API-2024-003',
                name: 'API Integration',
                description: 'Integration with third-party payment gateway and CRM systems',
                status: 'planned',
                progress: 10,
                start_date: '2024-12-01',
                end_date: '2025-02-28',
                budget: 100000,
                tags: ['backend', 'integration']
            },
            {
                code: 'DATA-2024-004',
                name: 'Data Migration',
                description: 'Migrate legacy data to new cloud infrastructure',
                status: 'completed',
                progress: 100,
                start_date: '2024-09-01',
                end_date: '2024-10-31',
                budget: 80000,
                tags: ['database', 'cloud', 'completed']
            }
        ];

        const projectIds = [];

        for (const proj of projects) {
            const projectResult = await query(`
                INSERT INTO project.projects (
                    org_id, code, name, description, status, manager_user_id,
                    progress_mode, progress_pct, start_date, end_date, tags,
                    created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
                RETURNING id, name
            `, [
                orgId,
                proj.code,
                proj.name,
                proj.description,
                proj.status,
                manager.id,
                'manual',
                proj.progress,
                proj.start_date,
                proj.end_date,
                proj.tags
            ]);

            projectIds.push({
                id: projectResult.rows[0].id,
                name: projectResult.rows[0].name,
                status: proj.status
            });

            console.log(`  ✓ Created: ${proj.name} (${proj.status})`);
        }

        // ========================================
        // Create Tasks for Projects
        // ========================================
        console.log('\n📋 Creating tasks...');

        const tasks = [
            // Website Redesign tasks
            { project: 0, title: 'Design Homepage Mockup', description: 'Create modern homepage design with hero section', assignee: employee.id, status: 'completed', priority: 'high' },
            { project: 0, title: 'Implement Responsive Navigation', description: 'Build mobile-responsive navigation menu', assignee: employee.id, status: 'in_progress', priority: 'high' },
            { project: 0, title: 'Create Contact Form', description: 'Develop contact form with validation', assignee: employee.id, status: 'todo', priority: 'medium' },
            { project: 0, title: 'SEO Optimization', description: 'Optimize meta tags and site structure for SEO', assignee: manager.id, status: 'in_progress', priority: 'medium' },
            
            // Mobile App tasks
            { project: 1, title: 'User Authentication Module', description: 'Implement login/signup with social auth', assignee: employee.id, status: 'completed', priority: 'high' },
            { project: 1, title: 'Dashboard UI Development', description: 'Create main dashboard with charts and stats', assignee: employee.id, status: 'in_progress', priority: 'high' },
            { project: 1, title: 'Push Notifications Setup', description: 'Configure Firebase push notifications', assignee: employee.id, status: 'todo', priority: 'medium' },
            { project: 1, title: 'App Store Submission', description: 'Prepare app for iOS and Android stores', assignee: manager.id, status: 'todo', priority: 'low' },
            
            // API Integration tasks
            { project: 2, title: 'Payment Gateway Research', description: 'Evaluate Stripe, Razorpay options', assignee: manager.id, status: 'in_progress', priority: 'high' },
            { project: 2, title: 'CRM API Documentation', description: 'Review Salesforce API documentation', assignee: employee.id, status: 'todo', priority: 'medium' },
            
            // Data Migration tasks (completed)
            { project: 3, title: 'Database Schema Migration', description: 'Migrate database schema to PostgreSQL', assignee: employee.id, status: 'completed', priority: 'high' },
            { project: 3, title: 'Data Validation & Testing', description: 'Validate migrated data integrity', assignee: manager.id, status: 'completed', priority: 'high' }
        ];

        for (const task of tasks) {
            const projectId = projectIds[task.project].id;
            
            await query(`
                INSERT INTO project.tasks (
                    org_id, project_id, title, description, 
                    assigned_to_user_id, status, priority, stage,
                    created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            `, [
                orgId,
                projectId,
                task.title,
                task.description,
                task.assignee,
                task.status,
                task.priority,
                task.status === 'todo' ? 'backlog' : (task.status === 'completed' ? 'done' : 'in_progress')
            ]);

            const assigneeName = task.assignee === employee.id ? 'Employee' : 'Manager';
            console.log(`  ✓ ${task.title} (${task.status}) → ${assigneeName}`);
        }

        // ========================================
        // Create Expenses for Employee
        // ========================================
        console.log('\n💰 Creating expenses...');

        const expenses = [
            {
                project: 0,
                description: 'UI/UX Design Software License',
                category: 'software',
                amount: 5999,
                date: '2024-11-05',
                status: 'approved',
                payment_method: 'company_card'
            },
            {
                project: 0,
                description: 'Stock Photos & Icons Purchase',
                category: 'materials',
                amount: 2500,
                date: '2024-11-08',
                status: 'pending',
                payment_method: 'personal'
            },
            {
                project: 1,
                description: 'Mobile Testing Devices',
                category: 'equipment',
                amount: 45000,
                date: '2024-11-02',
                status: 'approved',
                payment_method: 'company_card'
            },
            {
                project: 1,
                description: 'Cloud Hosting Subscription',
                category: 'software',
                amount: 3500,
                date: '2024-11-10',
                status: 'pending',
                payment_method: 'company_card'
            },
            {
                project: 1,
                description: 'Client Meeting Lunch',
                category: 'meals',
                amount: 2800,
                date: '2024-11-07',
                status: 'approved',
                payment_method: 'personal'
            },
            {
                project: 2,
                description: 'API Documentation Tools',
                category: 'software',
                amount: 1999,
                date: '2024-11-09',
                status: 'draft',
                payment_method: 'personal'
            }
        ];

        for (const expense of expenses) {
            const projectId = projectIds[expense.project].id;
            
            await query(`
                INSERT INTO finance.expenses (
                    org_id, project_id, user_id, description, category,
                    amount, expense_date, status, payment_method,
                    currency, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            `, [
                orgId,
                projectId,
                employee.id,
                expense.description,
                expense.category,
                expense.amount,
                expense.date,
                expense.status,
                expense.payment_method,
                'INR'
            ]);

            console.log(`  ✓ ₹${expense.amount} - ${expense.description} (${expense.status})`);
        }

        // ========================================
        // Create Timesheets
        // ========================================
        console.log('\n⏱️  Creating timesheets...');

        const timesheets = [
            // Employee timesheets
            { project: 0, user: employee.id, date: '2024-11-04', hours: 8, description: 'Homepage design mockup creation', status: 'approved' },
            { project: 0, user: employee.id, date: '2024-11-05', hours: 7.5, description: 'Responsive navigation implementation', status: 'approved' },
            { project: 0, user: employee.id, date: '2024-11-06', hours: 8, description: 'Navigation testing and bug fixes', status: 'pending' },
            { project: 1, user: employee.id, date: '2024-11-07', hours: 8, description: 'Authentication module development', status: 'approved' },
            { project: 1, user: employee.id, date: '2024-11-08', hours: 6, description: 'Dashboard UI components', status: 'pending' },
            
            // Manager timesheets
            { project: 0, user: manager.id, date: '2024-11-04', hours: 4, description: 'SEO strategy planning', status: 'approved' },
            { project: 2, user: manager.id, date: '2024-11-06', hours: 5, description: 'Payment gateway research', status: 'approved' },
            { project: 1, user: manager.id, date: '2024-11-08', hours: 3, description: 'Project review and planning', status: 'pending' }
        ];

        for (const timesheet of timesheets) {
            const projectId = projectIds[timesheet.project].id;
            const userName = timesheet.user === employee.id ? 'Employee' : 'Manager';
            
            await query(`
                INSERT INTO ops.timesheets (
                    org_id, project_id, user_id, work_date, hours_worked,
                    description, status, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            `, [
                orgId,
                projectId,
                timesheet.user,
                timesheet.date,
                timesheet.hours,
                timesheet.description,
                timesheet.status
            ]);

            console.log(`  ✓ ${timesheet.date} - ${timesheet.hours}h by ${userName} (${timesheet.status})`);
        }

        // ========================================
        // Summary
        // ========================================
        console.log('\n✅ Sample data created successfully!\n');
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║                    DATA SUMMARY                            ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log(`║ Projects Created:     ${projects.length}                                        ║`);
        console.log(`║ Tasks Created:        ${tasks.length}                                       ║`);
        console.log(`║ Expenses Created:     ${expenses.length}                                        ║`);
        console.log(`║ Timesheets Created:   ${timesheets.length}                                        ║`);
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log('║ Test as Manager:   darshanmved@gmail.com                   ║');
        console.log('║   - View all projects                                      ║');
        console.log('║   - Manage tasks                                           ║');
        console.log('║   - Approve expenses                                       ║');
        console.log('║                                                            ║');
        console.log('║ Test as Employee:  employee.test@gmail.com                 ║');
        console.log('║   Password: employee123                                    ║');
        console.log('║   - View assigned projects                                 ║');
        console.log('║   - See assigned tasks                                     ║');
        console.log('║   - View submitted expenses                                ║');
        console.log('║   - Check timesheets                                       ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating sample data:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the script
createSampleData();
