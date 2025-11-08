/**
 * Seed Dummy Projects Data
 * This script inserts sample projects into the project.projects table
 */

const { pool } = require('../config/database');
require('dotenv').config();

const dummyProjects = [
  {
    name: 'Website Redesign 2025',
    description: 'Complete overhaul of company website with modern UI/UX design, improved performance, and mobile responsiveness.',
    status: 'in_progress',
    start_date: '2025-01-15',
    end_date: '2025-03-30',
    progress_pct: 65,
    manager_email: 'gaurav@example.com',
    tags: ['design', 'frontend', 'high-priority'],
    color: '#3b82f6'
  },
  {
    name: 'Mobile App Development',
    description: 'Native mobile application for iOS and Android platforms with offline capabilities and push notifications.',
    status: 'in_progress',
    start_date: '2025-02-01',
    end_date: '2025-06-30',
    progress_pct: 35,
    manager_email: 'drashti@example.com',
    tags: ['mobile', 'ios', 'android'],
    color: '#10b981'
  },
  {
    name: 'Database Migration',
    description: 'Migrate legacy database to PostgreSQL with data validation and zero-downtime deployment.',
    status: 'completed',
    start_date: '2024-11-01',
    end_date: '2025-01-15',
    progress_pct: 100,
    manager_email: 'gaurav@example.com',
    tags: ['backend', 'database', 'infrastructure'],
    color: '#8b5cf6'
  },
  {
    name: 'Customer Portal',
    description: 'Self-service portal for customers to manage accounts, view orders, and access support resources.',
    status: 'planned',
    start_date: '2025-04-01',
    end_date: '2025-07-31',
    progress_pct: 0,
    manager_email: 'drashti@example.com',
    tags: ['portal', 'customer', 'self-service'],
    color: '#f59e0b'
  },
  {
    name: 'API Documentation',
    description: 'Comprehensive API documentation with interactive examples, authentication guides, and best practices.',
    status: 'in_progress',
    start_date: '2025-02-15',
    end_date: '2025-03-15',
    progress_pct: 80,
    manager_email: 'gaurav@example.com',
    tags: ['documentation', 'api', 'developer'],
    color: '#ec4899'
  },
  {
    name: 'E-commerce Integration',
    description: 'Integration with major e-commerce platforms including Shopify, WooCommerce, and Magento.',
    status: 'planned',
    start_date: '2025-05-01',
    end_date: '2025-08-31',
    progress_pct: 0,
    manager_email: 'drashti@example.com',
    tags: ['ecommerce', 'integration', 'api'],
    color: '#14b8a6'
  },
  {
    name: 'Security Audit 2025',
    description: 'Comprehensive security audit including penetration testing, code review, and compliance assessment.',
    status: 'in_progress',
    start_date: '2025-03-01',
    end_date: '2025-04-15',
    progress_pct: 45,
    manager_email: 'gaurav@example.com',
    tags: ['security', 'audit', 'compliance'],
    color: '#ef4444'
  },
  {
    name: 'Analytics Dashboard',
    description: 'Real-time analytics dashboard with customizable widgets, data visualization, and automated reporting.',
    status: 'in_progress',
    start_date: '2025-01-20',
    end_date: '2025-04-30',
    progress_pct: 55,
    manager_email: 'drashti@example.com',
    tags: ['analytics', 'dashboard', 'reporting'],
    color: '#6366f1'
  },
  {
    name: 'Payment Gateway Integration',
    description: 'Multi-payment gateway integration supporting Stripe, PayPal, and local payment methods.',
    status: 'completed',
    start_date: '2024-12-01',
    end_date: '2025-02-01',
    progress_pct: 100,
    manager_email: 'gaurav@example.com',
    tags: ['payment', 'integration', 'fintech'],
    color: '#22c55e'
  },
  {
    name: 'Cloud Infrastructure Setup',
    description: 'Setup AWS infrastructure with auto-scaling, load balancing, and disaster recovery capabilities.',
    status: 'completed',
    start_date: '2024-10-01',
    end_date: '2024-12-31',
    progress_pct: 100,
    manager_email: 'drashti@example.com',
    tags: ['cloud', 'aws', 'infrastructure'],
    color: '#a855f7'
  },
  {
    name: 'AI Chatbot Development',
    description: 'Intelligent chatbot with NLP capabilities for customer support and lead generation.',
    status: 'planned',
    start_date: '2025-06-01',
    end_date: '2025-09-30',
    progress_pct: 0,
    manager_email: 'gaurav@example.com',
    tags: ['ai', 'chatbot', 'nlp'],
    color: '#f97316'
  },
  {
    name: 'Inventory Management System',
    description: 'Real-time inventory tracking with barcode scanning, automated reordering, and multi-warehouse support.',
    status: 'in_progress',
    start_date: '2025-02-10',
    end_date: '2025-05-31',
    progress_pct: 40,
    manager_email: 'drashti@example.com',
    tags: ['inventory', 'warehouse', 'logistics'],
    color: '#84cc16'
  },
  {
    name: 'Employee Training Portal',
    description: 'Learning management system with video courses, quizzes, certifications, and progress tracking.',
    status: 'planned',
    start_date: '2025-07-01',
    end_date: '2025-10-31',
    progress_pct: 0,
    manager_email: 'gaurav@example.com',
    tags: ['training', 'lms', 'hr'],
    color: '#06b6d4'
  },
  {
    name: 'Social Media Integration',
    description: 'Automated social media posting and monitoring across Facebook, Twitter, LinkedIn, and Instagram.',
    status: 'in_progress',
    start_date: '2025-03-15',
    end_date: '2025-05-15',
    progress_pct: 25,
    manager_email: 'drashti@example.com',
    tags: ['social-media', 'automation', 'marketing'],
    color: '#d946ef'
  },
  {
    name: 'Reporting System Upgrade',
    description: 'Enhanced reporting capabilities with scheduled reports, custom templates, and export options.',
    status: 'completed',
    start_date: '2024-11-15',
    end_date: '2025-01-31',
    progress_pct: 100,
    manager_email: 'gaurav@example.com',
    tags: ['reporting', 'analytics', 'business-intelligence'],
    color: '#0ea5e9'
  }
];

async function seedProjects() {
    const client = await pool.connect();
    
    try {
        console.log('🌱 Starting to seed dummy projects...\n');

        // Get organization
        const orgResult = await client.query('SELECT id FROM auth.orgs WHERE slug = $1', ['default-org']);
        if (orgResult.rows.length === 0) {
            throw new Error('Organization not found. Please run setup-initial-data.js first.');
        }
        const orgId = orgResult.rows[0].id;
        console.log(`📁 Using organization: ${orgId}\n`);

        // Clear existing projects (optional - comment out if you want to keep existing)
        console.log('🗑️  Clearing existing projects...');
        await client.query('DELETE FROM project.projects WHERE org_id = $1', [orgId]);
        console.log('✅ Existing projects cleared\n');

        // Insert dummy projects
        console.log('📦 Inserting dummy projects...\n');
        let successCount = 0;

        for (const project of dummyProjects) {
            try {
                // Get manager user ID
                let managerUserId = null;
                if (project.manager_email) {
                    const managerResult = await client.query(
                        'SELECT id FROM auth.users WHERE email = $1 AND org_id = $2',
                        [project.manager_email, orgId]
                    );
                    if (managerResult.rows.length > 0) {
                        managerUserId = managerResult.rows[0].id;
                    }
                }

                const insertQuery = `
                    INSERT INTO project.projects (
                        org_id, name, description, status, start_date, end_date,
                        progress_pct, manager_user_id, tags, color
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING id, name
                `;

                const result = await client.query(insertQuery, [
                    orgId,
                    project.name,
                    project.description,
                    project.status,
                    project.start_date,
                    project.end_date,
                    project.progress_pct,
                    managerUserId,
                    project.tags,
                    project.color
                ]);

                successCount++;
                const created = result.rows[0];
                console.log(`✅ ${successCount}. Created: "${created.name}" (${created.id.substring(0, 8)}...)`);

            } catch (error) {
                console.error(`❌ Failed to create "${project.name}":`, error.message);
            }
        }

        console.log(`\n🎉 Successfully created ${successCount} out of ${dummyProjects.length} projects!\n`);

        // Show summary
        console.log('📊 Project Summary by Status:\n');
        const summaryResult = await client.query(`
            SELECT 
                status,
                COUNT(*) as count,
                ROUND(AVG(progress_pct), 2) as avg_progress
            FROM project.projects
            WHERE org_id = $1
            GROUP BY status
            ORDER BY status
        `, [orgId]);

        summaryResult.rows.forEach(row => {
            const statusName = row.status.replace('_', ' ').toUpperCase();
            console.log(`   ${statusName}: ${row.count} projects (Avg Progress: ${row.avg_progress}%)`);
        });

        console.log('\n🚀 Ready to test! Visit your projects page to see the data.\n');

    } catch (error) {
        console.error('❌ Error seeding projects:', error.message);
        console.error(error);
    } finally {
        client.release();
        await pool.end();
    }
}

seedProjects();
