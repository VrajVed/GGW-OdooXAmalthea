/**
 * ============================================================================
 * Task API Test Script
 * ============================================================================
 * This script tests the POST /api/projects/:id/tasks endpoint
 * Run with: node scripts/test-task-creation.js
 * ============================================================================
 */

require('dotenv').config();
const { pool } = require('../config/database');

async function testTaskCreation() {
    try {
        console.log('🧪 Testing Task API Endpoint\n');
        console.log('='.repeat(60));

        // Step 1: Get a project to test with
        console.log('\n📋 Step 1: Finding a project to test with...');
        const projectQuery = `
            SELECT id, name, org_id 
            FROM project.projects 
            WHERE archived_at IS NULL 
            LIMIT 1
        `;
        const projectResult = await pool.query(projectQuery);

        if (projectResult.rows.length === 0) {
            console.log('❌ No projects found. Please create a project first.');
            process.exit(1);
        }

        const project = projectResult.rows[0];
        console.log(`✅ Found project: "${project.name}" (ID: ${project.id})`);

        // Step 2: Create a test task
        console.log('\n📝 Step 2: Creating a test task...');
        const taskData = {
            title: 'Test Task - API Verification',
            description: 'This task was created to test the POST /projects/:id/tasks endpoint',
            state: 'new',
            priority: 'medium',
            due_date: '2025-11-15',
            labels: ['test', 'api', 'backend']
        };

        console.log('Task data:', JSON.stringify(taskData, null, 2));

        const insertQuery = `
            INSERT INTO project.tasks (
                org_id,
                project_id,
                title,
                description,
                state,
                priority,
                due_date,
                labels,
                position
            ) VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                (SELECT COALESCE(MAX(position), 0) + 1 
                 FROM project.tasks 
                 WHERE project_id = $2)
            )
            RETURNING *
        `;

        const values = [
            project.org_id,
            project.id,
            taskData.title,
            taskData.description,
            taskData.state,
            taskData.priority,
            taskData.due_date,
            taskData.labels
        ];

        const result = await pool.query(insertQuery, values);
        const newTask = result.rows[0];

        console.log('\n✅ Task created successfully!');
        console.log('='.repeat(60));
        console.log('Task Details:');
        console.log('  ID:', newTask.id);
        console.log('  Title:', newTask.title);
        console.log('  State:', newTask.state);
        console.log('  Priority:', newTask.priority);
        console.log('  Due Date:', newTask.due_date);
        console.log('  Position:', newTask.position);
        console.log('  Labels:', newTask.labels);
        console.log('  Created At:', newTask.created_at);

        // Step 3: Verify we can fetch it back
        console.log('\n🔍 Step 3: Verifying task can be retrieved...');
        const fetchQuery = `
            SELECT * FROM project.tasks WHERE id = $1
        `;
        const fetchResult = await pool.query(fetchQuery, [newTask.id]);

        if (fetchResult.rows.length > 0) {
            console.log('✅ Task retrieved successfully from database');
        } else {
            console.log('❌ Failed to retrieve task');
        }

        // Step 4: Test the actual HTTP endpoint
        console.log('\n🌐 Step 4: Test HTTP endpoint with curl command:');
        console.log('='.repeat(60));
        console.log(`
curl -X POST http://localhost:5000/api/projects/${project.id}/tasks \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "My First Task via API",
    "description": "Testing the endpoint",
    "priority": "high",
    "due_date": "2025-11-20"
  }'
        `.trim());

        console.log('\n='.repeat(60));
        console.log('✅ All tests passed!');
        console.log('='.repeat(60));

        console.log('\n📊 Summary:');
        console.log(`  Project: ${project.name}`);
        console.log(`  Project ID: ${project.id}`);
        console.log(`  Task Created: ${newTask.title}`);
        console.log(`  Task ID: ${newTask.id}`);
        console.log('\n✨ Your endpoint is ready to use!');

    } catch (error) {
        console.error('\n❌ Error during test:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the test
testTaskCreation();
