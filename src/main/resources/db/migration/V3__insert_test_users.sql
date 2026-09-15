-- Insert test users for development
-- Admin: phone="admin" (or "099999999"), password="AdminPassword123!"
-- Staff: phone="staff" (or "088888888"), password="StaffPassword123!"
-- Customer: phone="012345678" (or "customer"), password="Password123!"

-- Admin user
INSERT INTO users (id, name, phone, password_hash, role, is_active, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Admin User',
    'admin',
    '$2a$10$hqo6738NesmKEtlNNEboZuV9RB96OtZPkjtyxydDQHfyKcFrtWj46',
    'ADMIN',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (phone) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Staff user
INSERT INTO users (id, name, phone, password_hash, role, is_active, created_at, updated_at)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Staff User',
    'staff',
    '$2a$10$c3rKddZWG9pGBhvfF30qcOkhAUGhyuZss9gtaeuiIXhnWyne8XyBe',
    'STAFF',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (phone) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Customer user
INSERT INTO users (id, name, phone, password_hash, role, is_active, created_at, updated_at)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Customer User',
    '012345678',
    '$2a$10$nGGbTmlYoALtS978B48JE.pGlKyqUlfAuR8xYXIBySeTqgzyfKFta',
    'CUSTOMER',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (phone) DO UPDATE SET password_hash = EXCLUDED.password_hash;
