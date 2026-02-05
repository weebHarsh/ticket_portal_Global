-- Insert sample users (password is 'password123' hashed with bcrypt)
INSERT INTO users (email, password_hash, full_name, role, avatar_url) VALUES
('admin@example.com', '$2a$10$rKvVGKJZJQYxQGYvXQJxVOzKyYXYJZXYXYXYXYXYXYXYXYXYXYXYY', 'Admin User', 'admin', '/placeholder.svg?height=40&width=40'),
('agent@example.com', '$2a$10$rKvVGKJZJQYxQGYvXQJxVOzKyYXYJZXYXYXYXYXYXYXYXYXYXYXYY', 'Support Agent', 'agent', '/placeholder.svg?height=40&width=40'),
('user@example.com', '$2a$10$rKvVGKJZJQYxQGYvXQJxVOzKyYXYJZXYXYXYXYXYXYXYXYXYXYXYY', 'John Doe', 'user', '/placeholder.svg?height=40&width=40')
ON CONFLICT (email) DO NOTHING;

-- Insert sample tickets
INSERT INTO tickets (title, description, status, priority, category, assigned_to, created_by) VALUES
('Cannot login to account', 'I am unable to login to my account. Getting an error message.', 'open', 'high', 'Account', 2, 3),
('Feature request: Dark mode', 'It would be great to have a dark mode option in the app.', 'in-progress', 'low', 'Feature Request', 2, 3),
('Payment failed', 'My payment was declined but I was charged anyway.', 'open', 'urgent', 'Billing', NULL, 3),
('Bug: Page not loading', 'The dashboard page is not loading properly on mobile.', 'resolved', 'medium', 'Bug', 2, 3),
('Need help with setup', 'I need assistance setting up my account properly.', 'open', 'medium', 'Support', 2, 3);

-- Insert sample comments
INSERT INTO comments (ticket_id, user_id, content) VALUES
(1, 2, 'Thank you for reporting this. Can you please provide more details about the error message?'),
(1, 3, 'The error says "Invalid credentials" but I am sure my password is correct.'),
(2, 2, 'Great suggestion! We will add this to our roadmap.'),
(4, 2, 'This issue has been fixed in the latest release. Please update your app.');
