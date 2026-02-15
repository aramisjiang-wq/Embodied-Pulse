'use client';

import { useState, useEffect } from 'react';
import { 
  Modal, 
  Button, 
  Space, 
  Checkbox, 
  List, 
  Tag, 
  Input, 
  Select, 
  DatePicker, 
  message,
  Progress,
  Card,
  Divider,
  Typography
} from 'antd';
import { 
  DeleteOutlined, 
  EditOutlined, 
  ExportOutlined, 
  CheckOutlined, 
  CloseOutlined,
  DownloadOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Text } = Typography;

interface BatchOperationProps {
  open: boolean;
  items: any[];
  operationType: 'delete' | 'update' | 'export' | 'import';
  onConfirm: (selectedItems: any[], data?: any) => Promise<void>;
  onCancel: () => void;
}

export default function BatchOperation({ open, items, operationType, onConfirm, onCancel }: BatchOperationProps) {
  const [selectedItems, setSelectedItems] = useState<React.Key[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updateData, setUpdateData] = useState<any>({});
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'xlsx'>('json');

  useEffect(() => {
    if (open) {
      setSelectedItems([]);
      setSelectAll(false);
      setProgress(0);
      setUpdateData({});
    }
  }, [open]);

  useEffect(() => {
    if (selectAll) {
      setSelectedItems(items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  }, [selectAll, items]);

  const handleConfirm = async () => {
    if (selectedItems.length === 0) {
      message.warning('请至少选择一项');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const selected = items.filter(item => selectedItems.includes(item.id));

      if (operationType === 'export') {
        await handleExport(selected);
      } else {
        await onConfirm(selected, updateData);
      }

      message.success('操作成功');
      onCancel();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleExport = async (selected: any[]) => {
    const batchSize = 10;
    const batches = Math.ceil(selected.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const batch = selected.slice(i * batchSize, (i + 1) * batchSize);
      
      let content = '';
      let filename = '';
      let mimeType = '';

      if (exportFormat === 'json') {
        content = JSON.stringify(batch, null, 2);
        filename = `export_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.json`;
        mimeType = 'application/json';
      } else if (exportFormat === 'csv') {
        const headers = Object.keys(batch[0] || {}).join(',');
        const rows = batch.map(item => 
          Object.values(item).map(v => 
            typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
          ).join(',')
        );
        content = [headers, ...rows].join('\n');
        filename = `export_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`;
        mimeType = 'text/csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      setProgress(Math.round(((i + 1) / batches) * 100));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const getOperationTitle = () => {
    switch (operationType) {
      case 'delete':
        return '批量删除';
      case 'update':
        return '批量更新';
      case 'export':
        return '批量导出';
      case 'import':
        return '批量导入';
      default:
        return '批量操作';
    }
  };

  const getOperationIcon = () => {
    switch (operationType) {
      case 'delete':
        return <DeleteOutlined style={{ color: '#ff4d4f' }} />;
      case 'update':
        return <EditOutlined style={{ color: '#1890ff' }} />;
      case 'export':
        return <ExportOutlined style={{ color: '#52c41a' }} />;
      case 'import':
        return <DownloadOutlined style={{ color: '#fa8c16' }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  return (
    <Modal
      title={
        <Space>
          {getOperationIcon()}
          <span>{getOperationTitle()}</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="confirm"
          type={operationType === 'delete' ? 'primary' : 'default'}
          danger={operationType === 'delete'}
          onClick={handleConfirm}
          loading={loading}
          disabled={selectedItems.length === 0}
        >
          {loading ? '处理中...' : `确认${getOperationTitle().replace('批量', '')} (${selectedItems.length}项)`}
        </Button>,
      ]}
      width={800}
    >
      <div>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Checkbox
              checked={selectAll}
              onChange={(e) => setSelectAll(e.target.checked)}
            >
              全选 ({items.length}项)
            </Checkbox>
            <Text type="secondary">已选择 {selectedItems.length} 项</Text>
          </Space>
        </div>

        {loading && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Progress percent={progress} status="active" />
            <Text type="secondary">正在处理...</Text>
          </Card>
        )}

        {operationType === 'export' && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>导出格式：</Text>
              <Select
                value={exportFormat}
                onChange={setExportFormat}
                style={{ width: '100%' }}
                options={[
                  { label: 'JSON', value: 'json' },
                  { label: 'CSV', value: 'csv' },
                  { label: 'Excel (XLSX)', value: 'xlsx' },
                ]}
              />
            </Space>
          </Card>
        )}

        {operationType === 'update' && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>更新内容：</Text>
              <Select
                placeholder="选择要更新的字段"
                style={{ width: '100%' }}
                options={[
                  { label: '状态', value: 'status' },
                  { label: '分类', value: 'categories' },
                  { label: '标签', value: 'tags' },
                ]}
              />
              <Input placeholder="输入新值" />
            </Space>
          </Card>
        )}

        <div
          style={{
            maxHeight: 300,
            overflowY: 'auto',
            border: '1px solid #f0f0f0',
            borderRadius: 4,
          }}
        >
          <List
            dataSource={items}
            renderItem={(item, index) => (
              <List.Item
                style={{
                  padding: '8px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  background: selectedItems.includes(item.id) ? '#e6f7ff' : 'transparent',
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item.id));
                          setSelectAll(false);
                        }
                      }}
                    />
                  }
                  title={
                    <Space>
                      <Text strong>{item.title || item.name || item.id}</Text>
                      {item.status && <Tag color="blue">{item.status}</Tag>}
                    </Space>
                  }
                  description={
                    <Text type="secondary" ellipsis style={{ maxWidth: 400 }}>
                      {item.description || item.summary || item.abstract || '无描述'}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        </div>

        {selectedItems.length > 0 && (
          <div style={{ marginTop: 16, padding: 12, background: '#fff7e6', borderRadius: 4 }}>
            <Space>
              <CheckOutlined style={{ color: '#fa8c16' }} />
              <Text>已选择 {selectedItems.length} 项内容</Text>
              {operationType === 'delete' && (
                <Text type="danger">此操作不可恢复！</Text>
              )}
            </Space>
          </div>
        )}
      </div>
    </Modal>
  );
}
