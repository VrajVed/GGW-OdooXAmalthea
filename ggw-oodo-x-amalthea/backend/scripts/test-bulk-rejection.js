/**
 * Test script for bulk timesheet rejection workflow
 */

const http = require('http');

const API_BASE = 'localhost';
const API_PORT = 5000;

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

async function testBulkRejection() {
    console.log('🧪 Testing Bulk Timesheet Rejection\n');

    try {
        // Get pending timesheets
        console.log('1️⃣  Fetching pending timesheets...');
        const pendingResult = await makeRequest('GET', '/api/timesheets?status=pending');
        const pendingTimesheets = pendingResult.data.data || [];
        console.log(`   ✓ Found ${pendingTimesheets.length} pending timesheet(s)\n`);

        if (pendingTimesheets.length < 2) {
            console.log('   ⚠️  Need at least 2 pending timesheets to test bulk rejection');
            return;
        }

        // Select first 2 pending timesheets
        const idsToReject = pendingTimesheets.slice(0, 2).map(t => t.id);
        console.log('   Selected timesheets to reject:');
        pendingTimesheets.slice(0, 2).forEach((t, i) => {
            console.log(`   ${i + 1}. ${t.projectName} - ${t.hours}h (${t.workedOn})`);
        });
        console.log('');

        // Bulk reject
        console.log('2️⃣  Bulk rejecting timesheets...');
        const bulkRejectResult = await makeRequest(
            'POST',
            '/api/timesheets/bulk-reject',
            {
                timesheet_ids: idsToReject,
                reason: 'Bulk rejection test - please resubmit with correct hours'
            }
        );

        if (bulkRejectResult.status === 200 && bulkRejectResult.data.success) {
            console.log(`   ✓ Successfully rejected ${bulkRejectResult.data.data.rejected} timesheet(s)\n`);
        } else {
            console.log('   ❌ Bulk rejection failed');
            console.log(`   Response: ${JSON.stringify(bulkRejectResult.data)}\n`);
            return;
        }

        // Verify status changed
        console.log('3️⃣  Verifying rejected timesheets...');
        for (const id of idsToReject) {
            const verifyResult = await makeRequest('GET', `/api/timesheets/${id}`);
            if (verifyResult.status === 200 && verifyResult.data.success) {
                const timesheet = verifyResult.data.data;
                const statusEmoji = timesheet.status === 'rejected' ? '✅' : '❌';
                console.log(`   ${statusEmoji} ${timesheet.projectName}: ${timesheet.status}`);
            }
        }

        console.log('\n✅ Bulk rejection test completed!');

    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
    }
}

testBulkRejection();
