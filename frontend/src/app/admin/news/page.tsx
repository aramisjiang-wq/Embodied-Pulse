/**
 * 管理端 - 新闻管理页面
 * 支持富文本编辑
 */

import dynamic from 'next/dynamic';

const AdminNewsPageContent = dynamic(
  () => import('./AdminNewsPageContent'),
  { ssr: false, loading: () => <div style={{ padding: 50, textAlign: 'center' }}>加载中...</div> }
);

export default function AdminNewsPage() {
  return <AdminNewsPageContent />;
}
