/**
 * ============================================================================
 * Dynamic Sample Data Seeder
 * ============================================================================
 * This script dynamically creates sample projects, tasks, and expenses
 * based on actual users in the database
 * 
 * Usage: node scripts/seed-sample-data.js
 * ============================================================================
 */

const { query } = require('../config/database');

async function seedSampleData() {
    try {
        console.log('\n🌱 Starting dynamic data seeding...\n');

        // ========================================
        // Get actual users from database
        // ========================================
        const usersResult = await query(`
            SELECT 
                u.id, 
                u.org_id, 
                u.email, 
                u.full_name,
                ur.role
            FROM auth.users u
            LEFT JOIN auth.user_roles ur ON u.id = ur.user_id
            WHERE u.is_active = true
            ORDER BY u.email
        `);

        if (usersResult.rows.length === 0) {
            console.log('❌ No users found in database!');
            process.exit(1);
        }

        const users = usersResult.rows;
        console.log(`✓ Found ${users.length} active users`);

        // Find project managers and employees
        const projectManagers = users.filter(u => 
            u.role === 'project_manager' || u.role === 'admin'
        );
        const employees = users.filter(u => 
            u.role === 'team_member' || u.role === 'finance'
        );

        console.log(`  - ${projectManagers.length} project manager(s)`);
        console.log(`  - ${employees.length} employee(s)\n`);

        if (projectManagers.length === 0) {
            console.log('❌ No project managers found! Please assign a user the project_manager role.');
            console.log('Run: node scripts/assign-user-role.js <email> project_manager');
            process.exit(1);
        }

        if (employees.length === 0) {
            console.log('⚠️  No employees found! Creating projects without employee assignments.');
        }

        const orgId = users[0].org_id;
        
        // Prefer actual project_manager role over admin
        const manager = projectManagers.find(u => u.role === 'project_manager') || projectManagers[0];
        const managerId = manager.id;
        const managerName = manager.full_name;
        
        const employeeId = employees.length > 0 ? employees[0].id : null;
        const employeeName = employees.length > 0 ? employees[0].full_name : 'N/A';

        console.log(`📋 Using Manager: ${managerName}`);
        if (employeeId) {
            console.log(`👤 Using Employee: ${employeeName}\n`);
        }

        // ========================================
        // Clean existing sample data (optional)
        // ========================================
        console.log('🧹 Checking for existing sample data...');
        const existingProjects = await query(`
            SELECT COUNT(*) as count FROM project.projects 
            WHERE code LIKE 'PROJ-%'
        `);
        
        if (parseInt(existingProjects.rows[0].count) > 0) {
            console.log(`⚠️  Found ${existingProjects.rows[0].count} existing sample projects`);
            console.log('   Deleting old sample data to start fresh...');
            
            // Delete in correct order to respect foreign keys
            await query(`DELETE FROM project.timesheets WHERE project_id IN (SELECT id FROM project.projects WHERE code LIKE 'PROJ-%')`);
            await query(`DELETE FROM finance.expenses WHERE project_id IN (SELECT id FROM project.projects WHERE code LIKE 'PROJ-%')`);
            await query(`DELETE FROM project.tasks WHERE project_id IN (SELECT id FROM project.projects WHERE code LIKE 'PROJ-%')`);
            await query(`DELETE FROM project.project_members WHERE project_id IN (SELECT id FROM project.projects WHERE code LIKE 'PROJ-%')`);
            await query(`DELETE FROM project.projects WHERE code LIKE 'PROJ-%'`);
            
            console.log('   ✓ Cleaned up old sample data\n');
        }

        // ========================================
        // Create Projects
        // ========================================
        console.log('📦 Creating projects...');

        const projectsData = [
            {
                code: 'PROJ-001',
                name: 'Website Redesign',
                description: 'Complete redesign of company website with modern UI/UX',
                status: 'in_progress',
                progress: 35,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                tags: ['web', 'design', 'urgent']
            },
            {
                code: 'PROJ-002',
                name: 'Mobile App Development',
                description: 'Develop cross-platform mobile application for iOS and Android',
                status: 'in_progress',
                progress: 60,
                startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Started 15 days ago
                endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
                tags: ['mobile', 'ios', 'android']
            },
            {
                code: 'PROJ-003',
                name: 'Database Migration',
                description: 'Migrate legacy database to PostgreSQL with data integrity checks',
                status: 'planned',
                progress: 10,
                startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Starts in 7 days
                endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                tags: ['database', 'migration']
            },
            {
                code: 'PROJ-004',
                name: 'API Integration',
                description: 'Integrate third-party payment gateway and shipping APIs',
                status: 'in_progress',
                progress: 45,
                startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
                tags: ['api', 'integration', 'payment']
            }
        ];

        const createdProjects = [];
        for (const proj of projectsData) {
            const result = await query(`
                INSERT INTO project.projects (
                    org_id, code, name, description, status, manager_user_id,
                    progress_mode, progress_pct, start_date, end_date, tags,
                    created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
                RETURNING id, code, name
            `, [
                orgId, proj.code, proj.name, proj.description, proj.status,
                managerId, 'manual', proj.progress, proj.startDate, proj.endDate,
                proj.tags
            ]);
            
            createdProjects.push(result.rows[0]);
            console.log(`  ✓ Created: ${proj.code} - ${proj.name}`);
        }

        // ========================================
        // Assign Employee to Projects
        // ========================================
        if (employeeId) {
            console.log(`\n👥 Assigning ${employeeName} to projects...`);
            for (const project of createdProjects) {
                await query(`
                    INSERT INTO project.project_members (org_id, project_id, user_id)
                    VALUES ($1, $2, $3)
                    ON CONFLICT DO NOTHING
                `, [orgId, project.id, employeeId]);
                
                console.log(`  ✓ Assigned to: ${project.name}`);
            }
        }

        // ========================================
        // Create Tasks for Each Project
        // ========================================
        console.log('\n📝 Creating tasks...');
        
        const tasksPerProject = [
            // Website Redesign tasks
            [
                { title: 'Design homepage mockup', description: 'Create wireframes and high-fidelity mockups', state: 'done', priority: 'high' },
                { title: 'Implement responsive navigation', description: 'Build mobile-first navigation component', state: 'in_progress', priority: 'high' },
                { title: 'Optimize images and assets', description: 'Compress and optimize all media files', state: 'new', priority: 'medium' },
                { title: 'SEO optimization', description: 'Add meta tags, schema markup, and improve performance', state: 'new', priority: 'low' }
            ],
            // Mobile App tasks
            [
                { title: 'Setup React Native project', description: 'Initialize project with proper structure', state: 'done', priority: 'high' },
                { title: 'Implement authentication flow', description: 'Build login, signup, and password reset', state: 'done', priority: 'high' },
                { title: 'Create product listing screen', description: 'Design and implement product catalog', state: 'in_progress', priority: 'medium' },
                { title: 'Integrate push notifications', description: 'Setup Firebase Cloud Messaging', state: 'new', priority: 'medium' }
            ],
            // Database Migration tasks
            [
                { title: 'Analyze current database schema', description: 'Document existing tables and relationships', state: 'in_progress', priority: 'high' },
                { title: 'Design PostgreSQL schema', description: 'Create optimized schema for PostgreSQL', state: 'new', priority: 'high' },
                { title: 'Write migration scripts', description: 'Create data migration and validation scripts', state: 'new', priority: 'medium' }
            ],
            // API Integration tasks
            [
                { title: 'Research payment gateway APIs', description: 'Compare Stripe, PayPal, and Razorpay', state: 'done', priority: 'high' },
                { title: 'Implement payment processing', description: 'Integrate selected payment gateway', state: 'in_progress', priority: 'high' },
                { title: 'Setup webhook handlers', description: 'Handle payment success/failure callbacks', state: 'in_progress', priority: 'high' },
                { title: 'Test payment flows', description: 'End-to-end testing of all payment scenarios', state: 'new', priority: 'medium' }
            ]
        ];

        let taskCount = 0;
        for (let i = 0; i < createdProjects.length; i++) {
            const project = createdProjects[i];
            const tasks = tasksPerProject[i];
            
            for (const task of tasks) {
                const taskResult = await query(`
                    INSERT INTO project.tasks (
                        org_id, project_id, title, description, state, 
                        priority, created_at, updated_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                    RETURNING id
                `, [
                    orgId, project.id, task.title, task.description, 
                    task.state, task.priority
                ]);
                
                // Assign task to employee
                if (employeeId) {
                    await query(`
                        INSERT INTO project.task_assignees (org_id, task_id, user_id)
                        VALUES ($1, $2, $3)
                    `, [orgId, taskResult.rows[0].id, employeeId]);
                }
                
                taskCount++;
            }
        }
        console.log(`  ✓ Created ${taskCount} tasks across all projects`);

        // ========================================
        // Create Expenses
        // ========================================
        if (employeeId) {
            console.log(`\n💰 Creating expenses for ${employeeName}...`);
            
            const expensesData = [
                {
                    projectId: createdProjects[0].id, // Website Redesign
                    category: 'Software',
                    description: 'Adobe Creative Cloud subscription for design work',
                    amount: 4999.00,
                    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                    status: 'submitted'
                },
                {
                    projectId: createdProjects[1].id, // Mobile App
                    category: 'Equipment',
                    description: 'iPhone 15 Pro for iOS testing',
                    amount: 129900.00,
                    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                    status: 'approved'
                },
                {
                    projectId: createdProjects[1].id, // Mobile App
                    category: 'Software',
                    description: 'Firebase premium plan for notifications',
                    amount: 2499.00,
                    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                    status: 'submitted'
                },
                {
                    projectId: createdProjects[3].id, // API Integration
                    category: 'Services',
                    description: 'Stripe payment gateway setup fee',
                    amount: 5000.00,
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    status: 'approved'
                },
                {
                    projectId: createdProjects[0].id, // Website Redesign
                    category: 'Travel',
                    description: 'Client meeting - Taxi fare',
                    amount: 850.00,
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    status: 'submitted'
                },
                {
                    projectId: createdProjects[2].id, // Database Migration
                    category: 'Services',
                    description: 'Database consultation with PostgreSQL expert',
                    amount: 15000.00,
                    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    status: 'submitted'
                }
            ];

            for (const expense of expensesData) {
                await query(`
                    INSERT INTO finance.expenses (
                        org_id, project_id, user_id, category, note,
                        amount, currency, spent_on, status,
                        created_at, updated_at
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
                `, [
                    orgId, expense.projectId, employeeId, expense.category,
                    expense.description, expense.amount, 'INR', expense.date,
                    expense.status
                ]);
                console.log(`  ✓ ${expense.status.toUpperCase()}: ₹${expense.amount.toLocaleString()} - ${expense.description}`);
            }
        }

        // ========================================
        // Create Timesheets
        // ========================================
        if (employeeId) {
            console.log(`\n⏰ Creating timesheets for ${employeeName}...`);
            
            // Create timesheets for the last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                
                // Skip weekends
                if (date.getDay() === 0 || date.getDay() === 6) continue;
                
                // Randomly select a project for this timesheet
                const project = createdProjects[Math.floor(Math.random() * createdProjects.length)];
                
                // Random hours between 6-9
                const hours = 6 + Math.floor(Math.random() * 4);
                
                // Status: recent ones are draft/pending, older ones are approved
                let status;
                if (i <= 1) {
                    status = 'submitted';
                } else if (i <= 3) {
                    status = 'submitted';
                } else {
                    status = 'approved';
                }
                
                const descriptions = [
                    'Development work on core features',
                    'Bug fixes and code review',
                    'Client meeting and requirements gathering',
                    'Testing and QA activities',
                    'Documentation and code cleanup',
                    'Research and prototype development'
                ];
                
                await query(`
                    INSERT INTO project.timesheets (
                        org_id, project_id, user_id, worked_on, hours, note
                    )
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    orgId, project.id, employeeId, date, hours,
                    descriptions[Math.floor(Math.random() * descriptions.length)]
                ]);
                
                const dateStr = date.toISOString().split('T')[0];
                console.log(`  ✓ ${dateStr}: ${hours}h on ${project.name}`);
            }
        }

        // ========================================
        // Summary
        // ========================================
        console.log('\n' + '='.repeat(60));
        console.log('✅ Sample data seeded successfully!');
        console.log('='.repeat(60));
        console.log(`\n📊 Summary:`);
        console.log(`  - ${createdProjects.length} projects created`);
        console.log(`  - ${taskCount} tasks created`);
        if (employeeId) {
            console.log(`  - 6 expenses created`);
            console.log(`  - 5 timesheets created for past week`);
            console.log(`\n👤 Employee: ${employeeName}`);
            console.log(`   Can now see all projects, tasks, and submit expenses/timesheets`);
        }
        console.log(`\n👨‍💼 Manager: ${managerName}`);
        console.log(`   Can manage all projects, approve expenses and timesheets`);
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the seeder
seedSampleData();
