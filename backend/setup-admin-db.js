const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'admin.db');
const db = new sqlite3.Database(dbPath);

const createTables = `
CREATE TABLE IF NOT EXISTS "admins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "is_active" BOOLEAN NOT NULL DEFAULT 1,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_login_at" DATETIME,
    "tags" TEXT,
    "admin_number" TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "admin_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "admin_id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT 0,
    "can_create" BOOLEAN NOT NULL DEFAULT 0,
    "can_update" BOOLEAN NOT NULL DEFAULT 0,
    "can_delete" BOOLEAN NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    FOREIGN KEY ("admin_id") REFERENCES "admins" ("id") ON DELETE CASCADE,
    UNIQUE("admin_id", "module")
);

CREATE INDEX IF NOT EXISTS "admins_is_active_idx" ON "admins" ("is_active");
CREATE INDEX IF NOT EXISTS "admin_permissions_admin_id_idx" ON "admin_permissions" ("admin_id");
`;

const createAdmin = `
INSERT INTO "admins" (
    "id", "username", "email", "password_hash", "role", "is_active", 
    "created_at", "updated_at", "admin_number"
) VALUES (
    '188aa223-6c41-4a9d-bb61-b8d9a6413523',
    'ash',
    'admin@embodiedpulse.com',
    '$2b$10$rOzJlNqJqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZ',
    'super_admin',
    1,
    datetime('now'),
    datetime('now'),
    'ADMIN001'
);
`;

db.serialize(() => {
  db.exec(createTables, (err) => {
    if (err) {
      console.error('Error creating tables:', err);
    } else {
      console.log('Tables created successfully');
    }
  });

  db.run(createAdmin, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        console.log('Admin already exists');
      } else {
        console.error('Error creating admin:', err);
      }
    } else {
      console.log('Admin created successfully');
    }
  });

  db.close(() => {
    console.log('Database setup complete');
  });
});