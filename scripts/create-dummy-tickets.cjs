#!/usr/bin/env node

/**
 * Create Dummy Ticket Data
 * Usage: node scripts/create-dummy-tickets.cjs
 * 
 * This script creates comprehensive dummy ticket data for testing
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  process.exit(1);
}

console.log('🔍 Creating dummy ticket data...');
console.log('📍 Host:', new URL(databaseUrl).hostname);

const sql = neon(databaseUrl);

async function createDummyTickets() {
  try {
    // Read the SQL script
    const sqlScriptPath = path.join(__dirname, '020-create-dummy-tickets.sql');
    const sqlContent = fs.readFileSync(sqlScriptPath, 'utf-8');

    console.log('\n📝 Executing SQL script...');
    
    // Execute the SQL script
    // Note: Neon serverless doesn't support DO blocks directly, so we'll need to execute statements
    // For now, let's use a simpler approach with individual inserts
    
    // Get existing data
    console.log('📊 Fetching existing data...');
    const users = await sql`SELECT id, full_name, role FROM users LIMIT 10`;
    const targetBusinessGroups = await sql`SELECT id, name FROM target_business_groups LIMIT 10`;
    const categories = await sql`SELECT id, name FROM categories LIMIT 10`;
    const subcategories = await sql`SELECT id, name, category_id FROM subcategories LIMIT 10`;
    const projects = await sql`SELECT id, name FROM projects LIMIT 10`;
    
    if (users.length === 0) {
      console.error('❌ No users found. Please create users first.');
      process.exit(1);
    }
    
    if (targetBusinessGroups.length === 0) {
      console.error('❌ No target business groups found. Please create target business groups first.');
      process.exit(1);
    }
    
    console.log(`✅ Found ${users.length} users, ${targetBusinessGroups.length} target business groups`);
    
    // Get current max ticket number
    const maxTicketResult = await sql`SELECT COALESCE(MAX(ticket_number), 0) as max_num FROM tickets`;
    let ticketNumber = (maxTicketResult[0]?.max_num || 0) + 1;
    
    const adminUsers = users.filter(u => u.role === 'admin');
    const agentUsers = users.filter(u => u.role === 'agent');
    const spocUsers = adminUsers.length > 0 ? adminUsers : agentUsers;
    
    if (spocUsers.length === 0) {
      console.error('❌ No admin or agent users found for SPOC assignment.');
      process.exit(1);
    }
    
    console.log(`\n📝 Creating 50 dummy tickets...`);
    
    const ticketTitles = {
      support: [
        'Application not responding',
        'Unable to access shared drive',
        'Email synchronization issue',
        'VPN connection timeout',
        'Printer not printing',
        'Laptop screen flickering',
        'Software installation failed',
        'Password reset required',
        'Network connectivity problem',
        'System performance degradation'
      ],
      requirement: [
        'New feature: User dashboard enhancement',
        'Enhancement: Add export functionality',
        'Feature request: Mobile app support',
        'Improvement: Performance optimization',
        'New module: Reporting system',
        'Enhancement: Notification system',
        'Feature: Integration with third-party API',
        'Improvement: UI/UX redesign',
        'New feature: Analytics dashboard',
        'Enhancement: Search functionality'
      ]
    };
    
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const statuses = ['open', 'on-hold', 'resolved', 'closed', 'returned'];
    const statusWeights = [0.30, 0.20, 0.25, 0.20, 0.05]; // Weighted distribution
    
    let createdCount = 0;
    
    for (let i = 0; i < 50; i++) {
      const ticketType = Math.random() < 0.7 ? 'support' : 'requirement';
      const isInternal = Math.random() < 0.2;
      
      // Random selections
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomTBG = targetBusinessGroups[Math.floor(Math.random() * targetBusinessGroups.length)];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const categorySubcats = subcategories.filter(s => s.category_id === randomCategory.id);
      const randomSubcategory = categorySubcats.length > 0 
        ? categorySubcats[Math.floor(Math.random() * categorySubcats.length)]
        : null;
      const randomSpoc = spocUsers[Math.floor(Math.random() * spocUsers.length)];
      const randomProject = Math.random() < 0.3 && projects.length > 0
        ? projects[Math.floor(Math.random() * projects.length)]
        : null;
      
      // Random priority
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      
      // Weighted random status
      const rand = Math.random();
      let status = 'open';
      let cumulative = 0;
      for (let j = 0; j < statuses.length; j++) {
        cumulative += statusWeights[j];
        if (rand < cumulative) {
          status = statuses[j];
          break;
        }
      }
      
      // Random creation date (past 90 days)
      const daysAgo = Math.floor(Math.random() * 90);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
      
      let resolvedAt = null;
      let closedAt = null;
      
      if (status === 'resolved' || status === 'closed') {
        const resolveDays = Math.floor(Math.random() * (daysAgo - 1)) + 1;
        resolvedAt = new Date(createdAt);
        resolvedAt.setDate(resolvedAt.getDate() + resolveDays);
        
        if (status === 'closed') {
          const closeDays = Math.floor(Math.random() * 3) + 1;
          closedAt = new Date(resolvedAt);
          closedAt.setDate(closedAt.getDate() + closeDays);
        }
      }
      
      // Generate title and description
      const titleIndex = Math.floor(Math.random() * ticketTitles[ticketType].length);
      const title = ticketTitles[ticketType][titleIndex];
      
      let description = '';
      if (ticketType === 'support') {
        description = `User reported: ${title}. This issue started occurring ${
          ['yesterday', 'a few days ago', 'recently'][Math.floor(Math.random() * 3)]
        }. Impact: ${
          ['High - blocking daily work.', 'Medium - workaround available.', 'Low - minor inconvenience.'][Math.floor(Math.random() * 3)]
        }`;
      } else {
        description = `Requirement details: ${title}. Business justification: This feature will improve user experience and productivity. Expected benefits: ${
          ['Reduced processing time by 30%', 'Improved user satisfaction', 'Increased system efficiency'][Math.floor(Math.random() * 3)]
        }.`;
      }
      
      // Random estimated duration
      const durations = ['30 min', '1 hr', '2 hr', '4 hr', '1 day'];
      const estimatedDuration = durations[Math.floor(Math.random() * durations.length)];
      
      // Generate ticket ID
      const yyyymm = new Date().getFullYear().toString() + String(new Date().getMonth() + 1).padStart(2, '0');
      const ticketId = `TKT-${yyymm}-${String(ticketNumber).padStart(5, '0')}`;
      
      // Assignee (60% chance)
      const assignedTo = Math.random() < 0.6 ? randomSpoc.id : null;
      
      // Insert ticket
      await sql`
        INSERT INTO tickets (
          ticket_id,
          ticket_number,
          title,
          description,
          ticket_type,
          status,
          priority,
          category_id,
          subcategory_id,
          target_business_group_id,
          spoc_user_id,
          project_id,
          created_by,
          assigned_to,
          estimated_duration,
          is_internal,
          created_at,
          resolved_at,
          closed_at,
          updated_at
        ) VALUES (
          ${ticketId},
          ${ticketNumber},
          ${title},
          ${description},
          ${ticketType},
          ${status},
          ${priority},
          ${randomCategory.id},
          ${randomSubcategory?.id || null},
          ${randomTBG.id},
          ${randomSpoc.id},
          ${randomProject?.id || null},
          ${randomUser.id},
          ${assignedTo},
          ${estimatedDuration},
          ${isInternal},
          ${createdAt.toISOString()},
          ${resolvedAt ? resolvedAt.toISOString() : null},
          ${closedAt ? closedAt.toISOString() : null},
          ${closedAt ? closedAt.toISOString() : (resolvedAt ? resolvedAt.toISOString() : createdAt.toISOString())}
        )
      `;
      
      // Get the inserted ticket ID
      const ticketResult = await sql`SELECT id FROM tickets WHERE ticket_id = ${ticketId}`;
      const ticketIdNum = ticketResult[0].id;
      
      // Create audit log entries
      await sql`
        INSERT INTO ticket_audit_log (
          ticket_id,
          action_type,
          old_value,
          new_value,
          performed_by,
          performed_by_name,
          notes,
          created_at
        ) VALUES (
          ${ticketIdNum},
          'created',
          NULL,
          'Ticket created',
          ${randomUser.id},
          ${randomUser.full_name},
          NULL,
          ${createdAt.toISOString()}
        )
      `;
      
      if (status === 'resolved' || status === 'closed') {
        await sql`
          INSERT INTO ticket_audit_log (
            ticket_id,
            action_type,
            old_value,
            new_value,
            performed_by,
            performed_by_name,
            notes,
            created_at
          ) VALUES (
            ${ticketIdNum},
            'status_change',
            'open',
            'resolved',
            ${randomSpoc.id},
            ${randomSpoc.full_name},
            'Ticket resolved successfully',
            ${resolvedAt.toISOString()}
          )
        `;
        
        if (status === 'closed') {
          await sql`
            INSERT INTO ticket_audit_log (
              ticket_id,
              action_type,
              old_value,
              new_value,
              performed_by,
              performed_by_name,
              notes,
              created_at
            ) VALUES (
              ${ticketIdNum},
              'status_change',
              'resolved',
              'closed',
              ${randomUser.id},
              ${randomUser.full_name},
              'Ticket closed by initiator',
              ${closedAt.toISOString()}
            )
          `;
        }
      }
      
      // Create some comments (30% chance, 1-3 comments)
      if (Math.random() < 0.3) {
        const commentCount = 1 + Math.floor(Math.random() * 3);
        const commentTexts = [
          'Following up on this issue. Any updates?',
          'Thanks for the quick response!',
          'This is still occurring. Can you check again?',
          'The workaround is working for now.',
          'Please let me know if you need more information.'
        ];
        
        for (let j = 0; j < commentCount; j++) {
          const commentUser = users[Math.floor(Math.random() * users.length)];
          const commentText = commentTexts[Math.floor(Math.random() * commentTexts.length)];
          const commentDate = new Date(createdAt);
          commentDate.setHours(commentDate.getHours() + (j + 1));
          
          await sql`
            INSERT INTO comments (
              ticket_id,
              user_id,
              content,
              created_at
            ) VALUES (
              ${ticketIdNum},
              ${commentUser.id},
              ${commentText},
              ${commentDate.toISOString()}
            )
          `;
        }
      }
      
      ticketNumber++;
      createdCount++;
      
      if ((i + 1) % 10 === 0) {
        process.stdout.write(`\r   Progress: ${i + 1}/50 tickets created...`);
      }
    }
    
    console.log(`\n✅ Successfully created ${createdCount} dummy tickets!`);
    
    // Show summary
    const summary = await sql`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
        COUNT(CASE WHEN status = 'on-hold' THEN 1 END) as on_hold_tickets,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
        COUNT(CASE WHEN ticket_type = 'support' THEN 1 END) as support_tickets,
        COUNT(CASE WHEN ticket_type = 'requirement' THEN 1 END) as requirement_tickets,
        COUNT(CASE WHEN is_internal = true THEN 1 END) as internal_tickets
      FROM tickets
      WHERE ticket_id LIKE 'TKT-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '%'
    `;
    
    if (summary.length > 0) {
      const stats = summary[0];
      console.log('\n📊 Ticket Summary:');
      console.log(`   Total Tickets: ${stats.total_tickets}`);
      console.log(`   Open: ${stats.open_tickets} | On-Hold: ${stats.on_hold_tickets} | Resolved: ${stats.resolved_tickets} | Closed: ${stats.closed_tickets}`);
      console.log(`   Support: ${stats.support_tickets} | Requirement: ${stats.requirement_tickets}`);
      console.log(`   Internal: ${stats.internal_tickets} | Customer: ${stats.total_tickets - stats.internal_tickets}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error creating dummy tickets:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      if (error.stack) {
        console.error('   Stack:', error.stack);
      }
    }
    process.exit(1);
  }
}

createDummyTickets()
  .then(() => {
    console.log('\n🎉 Dummy ticket creation completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
