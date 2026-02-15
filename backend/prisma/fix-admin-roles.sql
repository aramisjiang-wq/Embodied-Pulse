-- 修复管理员角色
-- 将所有管理员的role设置为'super_admin'

UPDATE admins SET role = 'super_admin' WHERE role IS NULL OR role != 'super_admin';
