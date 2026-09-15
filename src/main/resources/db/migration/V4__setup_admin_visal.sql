-- Setup permanent production Admin account: Visal (0789789789)
-- Password is: 789789789

DELETE FROM users WHERE phone IN ('admin', 'staff', '012345678');

INSERT INTO users (id, name, phone, password_hash, role, is_active, created_at, updated_at)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Visal',
    '0789789789',
    '$2a$10$FAfdG6v3bCoGvMReDjNlIOYYFS3jJiZSJVwnQYz2ziFFfatYKCdm2',
    'ADMIN',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (phone) DO UPDATE 
SET name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    role = 'ADMIN',
    is_active = true;
