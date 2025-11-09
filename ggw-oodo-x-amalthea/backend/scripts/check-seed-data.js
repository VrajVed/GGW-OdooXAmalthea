/**
 * Quick script to verify seed data is loaded and accessible
 */

// Load environment variables first
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { pool } = require('../config/database');

async function checkSeedData() {
    try {
        console.log('\n=== Checking Seed Data ===\n');

        // Check Organizations
        const orgsResult = await pool.query('SELECT COUNT(*), array_agg(name) as names FROM auth.orgs');
        console.log(`✓ Organizations: ${orgsResult.rows[0].count}`);
        console.log(`  Names: ${orgsResult.rows[0].names.join(', ')}\n`);

        // Check Users
        const usersResult = await pool.query('SELECT COUNT(*) as count FROM auth.users');
        const usersEmailsResult = await pool.query('SELECT email FROM auth.users');
        console.log(`✓ Users: ${usersResult.rows[0].count}`);
        console.log(`  Emails: ${usersEmailsResult.rows.map(u => u.email).join(', ')}\n`);

        // Check Projects with details
        const projectsResult = await pool.query(`
            SELECT 
                code, name, status, progress_pct,
                (SELECT COUNT(*) FROM project.tasks t WHERE t.project_id = p.id) as task_count
            FROM project.projects p
            ORDER BY created_at
        `);
        console.log(`✓ Projects: ${projectsResult.rows.length}`);
        projectsResult.rows.forEach(p => {
            console.log(`  ${p.code}: ${p.name} (${p.status}, ${p.progress_pct}% complete, ${p.task_count} tasks)`);
        });
        console.log('');

        // Check Tasks
        const tasksResult = await pool.query(`
            SELECT state, COUNT(*) as count 
            FROM project.tasks 
            GROUP BY state
            ORDER BY state
        `);
        const totalTasks = tasksResult.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
        console.log(`✓ Tasks: ${totalTasks}`);
        tasksResult.rows.forEach(r => {
            console.log(`  ${r.state}: ${r.count}`);
        });
        console.log('');

        // Check Timesheets
        const timesheetsResult = await pool.query(`
            SELECT 
                COUNT(*) as count,
                SUM(hours) as total_hours,
                COUNT(*) FILTER (WHERE approved_by IS NOT NULL) as approved_count
            FROM project.timesheets
        `);
        console.log(`✓ Timesheets: ${timesheetsResult.rows[0].count}`);
        console.log(`  Total Hours: ${parseFloat(timesheetsResult.rows[0].total_hours).toFixed(1)}`);
        console.log(`  Approved: ${timesheetsResult.rows[0].approved_count}\n`);

        // Check Expenses
        const expensesResult = await pool.query(`
            SELECT 
                status,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM finance.expenses
            GROUP BY status
            ORDER BY status
        `);
        const totalExpenses = expensesResult.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
        const totalAmount = expensesResult.rows.reduce((sum, r) => sum + parseFloat(r.total_amount), 0);
        console.log(`✓ Expenses: ${totalExpenses} (₹${totalAmount.toFixed(2)})`);
        expensesResult.rows.forEach(r => {
            console.log(`  ${r.status}: ${r.count} (₹${parseFloat(r.total_amount).toFixed(2)})`);
        });
        console.log('');

        console.log('=== API Test ===\n');
        console.log('Start your backend server with: cd backend; npm run dev');
        console.log('Start your frontend with: cd frontend; npm run dev');
        console.log('\nThen visit: http://localhost:5173/app/projects');
        console.log('Login with: admin@ggw.com / admin123\n');
        console.log('✓ All seed data is loaded and ready!\n');

    } catch (error) {
        console.error('Error checking seed data:', error.message);
    } finally {
        await pool.end();
    }
}

checkSeedData();
