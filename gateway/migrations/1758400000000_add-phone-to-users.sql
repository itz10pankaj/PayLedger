-- Up Migration
ALTER TABLE users ADD COLUMN phone VARCHAR(15) UNIQUE;

-- Down Migration
ALTER TABLE users DROP COLUMN phone;
