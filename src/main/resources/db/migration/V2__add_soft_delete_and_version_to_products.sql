-- ==============================================================================
-- Migration V2: Add Soft Delete and Optimistic Locking Version to Products
-- ==============================================================================

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_deleted ON products(deleted);
