const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function createTestTickets() {
  const harsh = await sql`SELECT id FROM users WHERE email = 'harsh.thapliyal@mfilterit.com'`;
  const soju = await sql`SELECT id FROM users WHERE email = 'soju.jose@mfilterit.com'`;

  console.log('Harsh ID:', harsh[0] && harsh[0].id);
  console.log('Soju ID:', soju[0] && soju[0].id);

  if (!harsh[0] || !soju[0]) {
    console.log('Users not found!');
    return;
  }

  const harshId = harsh[0].id;
  const sojuId = soju[0].id;

  const now = new Date();
  const yyyymm = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0');
  const prefix = 'TKT-' + yyyymm + '%';

  const latestTicket = await sql`
    SELECT ticket_id FROM tickets
    WHERE ticket_id LIKE ${prefix}
    ORDER BY ticket_id DESC LIMIT 1
  `;

  let nextNum = 1;
  if (latestTicket.length > 0) {
    const lastNum = parseInt(latestTicket[0].ticket_id.split('-')[2]) || 0;
    nextNum = lastNum + 1;
  }

  const ticket1Id = 'TKT-' + yyyymm + '-' + nextNum.toString().padStart(5, '0');
  const ticket2Id = 'TKT-' + yyyymm + '-' + (nextNum+1).toString().padStart(5, '0');

  // Use business_unit_group_id = 18 (Others) or 16 (TD North)
  await sql`
    INSERT INTO tickets (ticket_id, title, description, ticket_type, status, created_by, spoc_user_id, business_unit_group_id)
    VALUES (${ticket1Id}, 'Test Support Ticket from Harsh', 'This is a test ticket created by Harsh Thapliyal.', 'support', 'open', ${harshId}, ${sojuId}, 18)
  `;
  console.log('Created:', ticket1Id);

  await sql`
    INSERT INTO tickets (ticket_id, title, description, ticket_type, status, created_by, assigned_to, spoc_user_id, business_unit_group_id)
    VALUES (${ticket2Id}, 'Test Requirement from Harsh', 'This is a test requirement ticket.', 'requirement', 'open', ${harshId}, ${harshId}, ${sojuId}, 18)
  `;
  console.log('Created:', ticket2Id);

  const harshTickets = await sql`
    SELECT id, ticket_id, title FROM tickets WHERE created_by = ${harshId} OR assigned_to = ${harshId}
  `;
  console.log('\nHarsh tickets:', harshTickets.length);
  harshTickets.forEach(t => console.log('  ' + t.ticket_id + ': ' + t.title));
}

createTestTickets();
