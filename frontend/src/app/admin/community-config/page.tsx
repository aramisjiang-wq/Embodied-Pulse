'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Input, Space, Tag, Typography, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface HotTopic {
  id: string;
  topic: string;
  count: number;
  isManual: boolean;
}

export default function CommunityConfigPage() {
  const [loading, setLoading] = useState(false);
  const [autoTopics, setAutoTopics] = useState<HotTopic[]>([]);
  const [manualTopics, setManualTopics] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [loadingAuto, setLoadingAuto] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const [manualRes, autoRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/community-config/hot-topics`).then(res => res.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/community-config/auto-topics`).then(res => res.json()),
      ]);

      if (manualRes.code === 0 && manualRes.data) {
        setManualTopics(manualRes.data.topics || []);
      }

      if (autoRes.code === 0 && autoRes.data) {
        setAutoTopics(autoRes.data.topics || []);
      }
    } catch (error) {
      message.error('加载热门话题失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = async () => {
    if (!newTopic.trim()) {
      message.warning('请输入话题名称');
      return;
    }

    if (manualTopics.includes(newTopic.trim())) {
      message.warning('该话题已存在');
      return;
    }

    const updatedTopics = [...manualTopics, newTopic.trim()];
    await saveTopics(updatedTopics);
    setNewTopic('');
    setShowAddModal(false);
  };

  const handleDeleteTopic = async (topic: string) => {
    const updatedTopics = manualTopics.filter(t => t !== topic);
    await saveTopics(updatedTopics);
  };

  const saveTopics = async (topics: string[]) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/community-config/hot-topics`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topics }),
      });

      const data = await res.json();
      if (data.code === 0) {
        setManualTopics(topics);
        message.success('保存成功');
      } else {
        message.error(data.message || '保存失败');
      }
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleLoadAutoTopics = async () => {
    setLoadingAuto(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/admin/community-config/auto-topics`).then(res => res.json());
      if (res.code === 0 && res.data) {
        setAutoTopics(res.data.topics || []);
        message.success('刷新成功');
      }
    } catch (error) {
      message.error('刷新失败');
    } finally {
      setLoadingAuto(false);
    }
  };

  const autoTopicColumns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '话题',
      dataIndex: 'topic',
      key: 'topic',
      render: (topic: string) => <Tag color="blue">{topic}</Tag>,
    },
    {
      title: '出现次数',
      dataIndex: 'count',
      key: 'count',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: HotTopic) => (
        <Space>
          {!manualTopics.includes(record.topic) && (
            <Button
              type="link"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                const updatedTopics = [...manualTopics, record.topic];
                saveTopics(updatedTopics);
              }}
            >
              添加
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const manualTopicColumns = [
    {
      title: '话题',
      dataIndex: 'topic',
      key: 'topic',
      render: (topic: string) => <Tag color="green">{topic}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: { key: number; topic: string }) => (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteTopic(record.topic)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>市集配置</Title>

      <Card
        title={
          <Space>
            <span>手动配置的热门话题</span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowAddModal(true)}
            >
              添加话题
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={manualTopicColumns}
          dataSource={manualTopics.map((topic, index) => ({ key: index, topic }))}
          pagination={false}
          size="small"
        />
      </Card>

      <Card
        title={
          <Space>
            <span>自动识别的热门话题（过去7天）</span>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleLoadAutoTopics}
              loading={loadingAuto}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          基于帖子标签自动统计，点击"添加"可将话题加入手动配置
        </Text>
        <Table
          columns={autoTopicColumns}
          dataSource={autoTopics.map((topic, index) => ({ key: index, ...topic }))}
          pagination={{ pageSize: 10 }}
          loading={loading}
          size="small"
        />
      </Card>

      <Modal
        title="添加热门话题"
        open={showAddModal}
        onOk={handleAddTopic}
        onCancel={() => {
          setShowAddModal(false);
          setNewTopic('');
        }}
        okText="添加"
        cancelText="取消"
      >
        <Input
          placeholder="输入话题名称"
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          onPressEnter={handleAddTopic}
          maxLength={20}
          showCount
        />
      </Modal>
    </div>
  );
}
