/**
 * Seed timesheets data
 */

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seedTimesheets() {
  const client = await pool.connect();
  try {
    console.log('Connected to database...');
    console.log('Seeding timesheet data...\n');
    
    // Get org and user IDs
    const orgResult = await client.query('SELECT id FROM auth.orgs LIMIT 1');
    if (orgResult.rows.length === 0) {
      console.error('No organization found. Please run seed-data.sql first.');
      return;
    }
    const orgId = orgResult.rows[0].id;
    
    const userResult = await client.query('SELECT id FROM auth.users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.error('No user found. Please run seed-data.sql first.');
      return;
    }
    const userId = userResult.rows[0].id;
    
    // Get projects
    const projectsResult = await client.query('SELECT id, code FROM project.projects ORDER BY code');
    if (projectsResult.rows.length === 0) {
      console.error('No projects found. Please run seed-data.sql first.');
      return;
    }
    
    console.log(`Found ${projectsResult.rows.length} projects`);
    console.log(`Using org: ${orgId}`);
    console.log(`Using user: ${userId}\n`);
    
    // Create timesheet entries
    const timesheets = [
      // Website Redesign project - Approved entries
      { project_code: 'PROJ-001', days_ago: 5, hours: 8.0, billable: true, note: 'Completed homepage design' },
      { project_code: 'PROJ-001', days_ago: 4, hours: 7.5, billable: true, note: 'Worked on navigation component' },
      { project_code: 'PROJ-001', days_ago: 3, hours: 6.0, billable: true, note: 'Fixed responsive issues' },
      
      // Mobile App Development - Mix of approved and pending
      { project_code: 'PROJ-002', days_ago: 10, hours: 8.0, billable: true, note: 'Setup React Native environment' },
      { project_code: 'PROJ-002', days_ago: 9, hours: 7.0, billable: true, note: 'Created login screen UI' },
      { project_code: 'PROJ-002', days_ago: 2, hours: 6.5, billable: false, note: 'Internal training session' },
      { project_code: 'PROJ-002', days_ago: 1, hours: 8.0, billable: true, note: 'Implemented authentication flow' },
      
      // Database Migration - Pending entries
      { project_code: 'PROJ-003', days_ago: 7, hours: 7.5, billable: true, note: 'Analyzed legacy schema' },
      { project_code: 'PROJ-003', days_ago: 6, hours: 8.0, billable: true, note: 'Created migration scripts' },
      { project_code: 'PROJ-003', days_ago: 1, hours: 6.0, billable: true, note: 'Testing migration process' },
      
      // Security Audit - Completed project
      { project_code: 'PROJ-004', days_ago: 30, hours: 8.0, billable: true, note: 'Vulnerability scanning' },
      { project_code: 'PROJ-004', days_ago: 29, hours: 7.5, billable: true, note: 'Penetration testing' },
      
      // API Integration - New project
      { project_code: 'PROJ-005', days_ago: 0, hours: 4.0, billable: true, note: 'Initial research and planning' }
    ];
    
    let insertedCount = 0;
    
    for (const ts of timesheets) {
      // Find project by code
      const project = projectsResult.rows.find(p => p.code === ts.project_code);
      if (!project) {
        console.log(`⚠️  Project ${ts.project_code} not found, skipping...`);
        continue;
      }
      
      // Calculate date
      const workedOn = new Date();
      workedOn.setDate(workedOn.getDate() - ts.days_ago);
      const workedOnStr = workedOn.toISOString().split('T')[0];
      
      // Insert timesheet
      const insertQuery = `
        INSERT INTO project.timesheets (
          org_id, project_id, user_id, worked_on, hours,
          is_billable, cost_rate, note, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      
      const result = await client.query(insertQuery, [
        orgId,
        project.id,
        userId,
        workedOnStr,
        ts.hours,
        ts.billable,
        1000.00, // cost_rate
        ts.note
      ]);
      
      if (result.rows.length > 0) {
        insertedCount++;
        console.log(`✓ Added timesheet for ${ts.project_code} - ${ts.note.substring(0, 40)}...`);
      }
    }
    
    // Approve timesheets older than 3 days
    console.log('\nApproving timesheets older than 3 days...');
    const approveQuery = `
      UPDATE project.timesheets
      SET approved_by = $1,
          approved_at = NOW()
      WHERE worked_on <= CURRENT_DATE - INTERVAL '3 days'
        AND approved_by IS NULL
        AND org_id = $2
      RETURNING id
    `;
    
    const approveResult = await client.query(approveQuery, [userId, orgId]);
    console.log(`✓ Approved ${approveResult.rows.length} timesheets\n`);
    
    // Show summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE approved_by IS NOT NULL) as approved,
        COUNT(*) FILTER (WHERE approved_by IS NULL) as pending,
        SUM(hours) as total_hours
      FROM project.timesheets
      WHERE org_id = $1
    `;
    
    const summary = await client.query(summaryQuery, [orgId]);
    const stats = summary.rows[0];
    
    console.log('='.repeat(50));
    console.log('Timesheet Summary:');
    console.log('='.repeat(50));
    console.log(`Total Timesheets: ${stats.total}`);
    console.log(`Approved: ${stats.approved}`);
    console.log(`Pending: ${stats.pending}`);
    console.log(`Total Hours: ${parseFloat(stats.total_hours).toFixed(1)}h`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Error seeding timesheets:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedTimesheets()
  .then(() => {
    console.log('\n✓ Timesheet seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Timesheet seeding failed:', error);
    process.exit(1);
  });
