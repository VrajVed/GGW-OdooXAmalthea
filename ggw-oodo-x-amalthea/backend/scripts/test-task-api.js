/**
 * ============================================================================
 * Task API HTTP Test Script
 * ============================================================================
 * Tests the actual HTTP endpoint using fetch
 * Run with: node scripts/test-task-api.js
 * ============================================================================
 */

const API_BASE = 'http://localhost:5000/api';

// Helper to make HTTP requests
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    
    const data = await response.json();
    return { status: response.status, data };
}

async function runTests() {
    console.log('🧪 Testing Task API via HTTP\n');
    console.log('='.repeat(60));

    try {
        // Step 1: Get a project to test with
        console.log('\n📋 Step 1: Getting a project...');
        const { data: projectsData } = await apiRequest('/projects');
        
        if (!projectsData.success || projectsData.data.length === 0) {
            console.log('❌ No projects found. Create a project first.');
            process.exit(1);
        }

        const project = projectsData.data[0];
        console.log(`✅ Using project: "${project.name}"`);
        console.log(`   Project ID: ${project.id}`);

        // Step 2: Test valid task creation
        console.log('\n📝 Step 2: Creating a valid task...');
        const validTask = {
            title: 'Test Task - HTTP API',
            description: 'This task was created via HTTP POST request',
            state: 'new',           // Valid: 'new', 'in_progress', 'blocked', 'done'
            priority: 'high',       // Valid: 'low', 'medium', 'high', 'urgent'
            due_date: '2025-11-20',
            estimate_hours: 8,
            labels: ['test', 'http', 'api']
        };

        console.log('Request body:', JSON.stringify(validTask, null, 2));
        
        const { status, data } = await apiRequest(`/projects/${project.id}/tasks`, {
            method: 'POST',
            body: JSON.stringify(validTask)
        });

        console.log(`\nResponse status: ${status}`);
        console.log('Response data:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('\n✅ Task created successfully!');
            console.log('='.repeat(60));
            console.log('Task Details:');
            console.log(`  ID: ${data.data.id}`);
            console.log(`  Title: ${data.data.title}`);
            console.log(`  State: ${data.data.state}`);
            console.log(`  Priority: ${data.data.priority}`);
            console.log(`  Position: ${data.data.position}`);
        } else {
            console.log('\n❌ Failed to create task:', data.message);
            return;
        }

        // Step 3: Test invalid state
        console.log('\n🧪 Step 3: Testing invalid state (should fail)...');
        const invalidStateTask = {
            title: 'Task with invalid state',
            state: 'invalid_state'
        };

        const { data: errorData } = await apiRequest(`/projects/${project.id}/tasks`, {
            method: 'POST',
            body: JSON.stringify(invalidStateTask)
        });

        if (!errorData.success) {
            console.log('✅ Validation working! Error:', errorData.message);
            console.log('   Valid values:', errorData.validValues);
        } else {
            console.log('❌ Should have failed with invalid state');
        }

        // Step 4: Test missing title
        console.log('\n🧪 Step 4: Testing missing title (should fail)...');
        const noTitleTask = {
            description: 'Task without title'
        };

        const { data: noTitleData } = await apiRequest(`/projects/${project.id}/tasks`, {
            method: 'POST',
            body: JSON.stringify(noTitleTask)
        });

        if (!noTitleData.success) {
            console.log('✅ Validation working! Error:', noTitleData.message);
        } else {
            console.log('❌ Should have failed with missing title');
        }

        // Step 5: Get all tasks for the project
        console.log('\n📋 Step 5: Fetching all tasks for project...');
        const { data: tasksData } = await apiRequest(`/projects/${project.id}/tasks`);

        if (tasksData.success) {
            console.log(`✅ Retrieved ${tasksData.count} tasks`);
            console.log('\nTasks:');
            tasksData.data.slice(0, 3).forEach((task, i) => {
                console.log(`  ${i + 1}. ${task.title} [${task.state}] (priority: ${task.priority})`);
            });
            if (tasksData.count > 3) {
                console.log(`  ... and ${tasksData.count - 3} more`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ All tests completed!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the tests
console.log('Starting tests...\n');
runTests().then(() => {
    console.log('\n✨ Test suite complete!');
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
