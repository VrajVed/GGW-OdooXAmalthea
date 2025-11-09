/**
 * Test script for timesheet rejection workflow
 * 
 * This script tests:
 * 1. Getting all timesheets
 * 2. Rejecting a timesheet
 * 3. Verifying the status changed to 'rejected'
 * 4. Getting rejected timesheets using status filter
 */

const http = require('http');

const API_BASE = 'localhost';
const API_PORT = 5000;

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_BASE,
            port: API_PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (body) {
            const bodyString = JSON.stringify(body);
            options.headers['Content-Length'] = Buffer.byteLength(bodyString);
        }

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

async function testRejectionWorkflow() {
    console.log('🧪 Testing Timesheet Rejection Workflow\n');

    try {
        // Step 1: Get all timesheets
        console.log('1️⃣  Fetching all timesheets...');
        const allTimesheets = await makeRequest('GET', '/api/timesheets');
        console.log(`   ✓ Found ${allTimesheets.data.data?.length || 0} timesheets\n`);

        // Find a pending timesheet to reject
        const pendingTimesheet = allTimesheets.data.data?.find(t => t.status === 'pending');
        
        if (!pendingTimesheet) {
            console.log('   ⚠️  No pending timesheets found to test rejection');
            return;
        }

        console.log(`   Found pending timesheet: ${pendingTimesheet.id}`);
        console.log(`   Project: ${pendingTimesheet.projectName}`);
        console.log(`   Hours: ${pendingTimesheet.hours}`);
        console.log(`   Status: ${pendingTimesheet.status}\n`);

        // Step 2: Reject the timesheet
        console.log('2️⃣  Rejecting timesheet...');
        const rejectResult = await makeRequest(
            'PATCH',
            `/api/timesheets/${pendingTimesheet.id}/reject`,
            { reason: 'Testing rejection workflow - hours not accurate' }
        );

        if (rejectResult.status === 200 && rejectResult.data.success) {
            console.log('   ✓ Timesheet rejected successfully');
            console.log(`   Status: ${rejectResult.data.data.status}\n`);
        } else {
            console.log('   ❌ Failed to reject timesheet');
            console.log(`   Response: ${JSON.stringify(rejectResult.data)}\n`);
            return;
        }

        // Step 3: Verify the timesheet status changed
        console.log('3️⃣  Verifying timesheet status...');
        const verifyResult = await makeRequest('GET', `/api/timesheets/${pendingTimesheet.id}`);
        
        if (verifyResult.status === 200 && verifyResult.data.success) {
            const timesheet = verifyResult.data.data;
            console.log(`   Status: ${timesheet.status}`);
            console.log(`   Note: ${timesheet.note}\n`);
            
            if (timesheet.status === 'rejected') {
                console.log('   ✅ Status correctly changed to "rejected"\n');
            } else {
                console.log(`   ❌ Status is "${timesheet.status}", expected "rejected"\n`);
            }
        } else {
            console.log('   ❌ Failed to fetch timesheet details\n');
        }

        // Step 4: Get all rejected timesheets
        console.log('4️⃣  Fetching all rejected timesheets...');
        const rejectedResult = await makeRequest('GET', '/api/timesheets?status=rejected');
        
        if (rejectedResult.status === 200 && rejectedResult.data.success) {
            const rejectedTimesheets = rejectedResult.data.data;
            console.log(`   ✓ Found ${rejectedTimesheets.length} rejected timesheet(s)`);
            
            rejectedTimesheets.forEach((t, i) => {
                console.log(`   ${i + 1}. ${t.projectName} - ${t.hours}h (${t.status})`);
            });
        }

        console.log('\n✅ Rejection workflow test completed!');

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
    }
}

// Run the test
testRejectionWorkflow();
