-- 仅新增地域字段 region，不修改、不删除任何现有列（保证不丢失数据）
-- SQLite: 在 backend 目录执行，或指定 USER_DATABASE_URL 对应的 .db 文件
-- 示例: sqlite3 prisma/dev-user.db < scripts/add-user-region-field.sql

ALTER TABLE users ADD COLUMN region TEXT;
