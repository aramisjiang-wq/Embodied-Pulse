-- 为用户表增加 身份(identityType) 与 组织名称(organizationName)
-- SQLite: 在项目根目录执行，或指定 USER_DATABASE_URL 对应的 .db 文件路径
-- 示例: sqlite3 prisma/user.db < scripts/add-user-profile-fields.sql

ALTER TABLE users ADD COLUMN identity_type TEXT;
ALTER TABLE users ADD COLUMN organization_name TEXT;
