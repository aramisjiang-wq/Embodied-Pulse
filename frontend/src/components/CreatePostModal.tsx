'use client';

import { useState } from 'react';
import { Modal, Form, Input, Select, Button, Space, App } from 'antd';
import { FileTextOutlined, VideoCameraOutlined, CodeOutlined, RobotOutlined, CalendarOutlined, TeamOutlined, MessageOutlined, ShareAltOutlined } from '@ant-design/icons';
import { communityApi } from '@/lib/api/community';
import { useAuthStore } from '@/store/authStore';

const { TextArea } = Input;
type CreatePostFormValues = {
  title: string;
  content: string;
  tags?: string[];
  contentId?: string;
};

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type PostType = 'discussion' | 'paper' | 'video' | 'repo' | 'model' | 'event' | 'job' | 'resource';

const POST_TYPES = [
  { key: 'discussion', label: '讨论', icon: <MessageOutlined />, description: '分享观点、求助问题' },
  { key: 'paper', label: '论文分享', icon: <FileTextOutlined />, description: '推广论文或推荐好论文' },
  { key: 'video', label: '视频分享', icon: <VideoCameraOutlined />, description: '分享有价值的视频' },
  { key: 'repo', label: '项目推荐', icon: <CodeOutlined />, description: '推荐GitHub项目' },
  { key: 'model', label: '模型推荐', icon: <RobotOutlined />, description: '推荐Hugging Face模型' },
  { key: 'event', label: '活动信息', icon: <CalendarOutlined />, description: '分享学术活动、会议' },
  { key: 'job', label: '招聘信息', icon: <TeamOutlined />, description: '发布或寻找工作机会' },
  { key: 'resource', label: '资源分享', icon: <ShareAltOutlined />, description: '分享其他有价值资源' },
];

const HOT_TOPICS = [
  '大模型', '计算机视觉', '自然语言处理', '强化学习',
  '机器人', '多模态', 'Transformer', '深度学习',
  '论文解读', '技术分享', '求职招聘', '学术交流',
];

export default function CreatePostModal({ open, onClose, onSuccess }: CreatePostModalProps) {
  const [form] = Form.useForm();
  const [selectedType, setSelectedType] = useState<PostType>('discussion');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { message } = App.useApp();

  const handleSubmit = async (values: CreatePostFormValues) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }

    setLoading(true);
    try {
      await communityApi.createPost({
        contentType: selectedType,
        title: values.title,
        content: values.content,
        tags: values.tags,
        contentId: values.contentId,
      });
      message.success('发布成功!');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '发布失败';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="发布帖子"
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnHidden
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item label="选择类型">
          <Space wrap size={8}>
            {POST_TYPES.map((type) => (
              <Button
                key={type.key}
                type={selectedType === type.key ? 'primary' : 'default'}
                icon={type.icon}
                onClick={() => setSelectedType(type.key as PostType)}
                style={{ borderRadius: 6 }}
              >
                {type.label}
              </Button>
            ))}
          </Space>
        </Form.Item>

        {selectedType !== 'discussion' && (
          <Form.Item
            name="contentId"
            label={`关联${POST_TYPES.find(t => t.key === selectedType)?.label.replace('分享', '').replace('推荐', '').replace('信息', '')}ID（可选）`}
            extra="如果分享的是平台已有资源，可以关联该资源"
          >
            <Input placeholder={`输入${POST_TYPES.find(t => t.key === selectedType)?.label.replace('分享', '').replace('推荐', '').replace('信息', '')}ID`} />
          </Form.Item>
        )}

        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="输入标题..." maxLength={100} showCount />
        </Form.Item>

        <Form.Item
          name="content"
          label="内容"
          rules={[
            { required: true, message: '请输入内容' },
            { min: 10, max: 5000, message: '内容长度必须在10-5000字符之间' },
          ]}
        >
          <TextArea
            rows={8}
            placeholder="详细描述你的内容..."
            maxLength={5000}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="tags"
          label="标签"
        >
          <Select
            mode="tags"
            placeholder="选择或输入标签"
            style={{ width: '100%' }}
            options={HOT_TOPICS.map(topic => ({ label: topic, value: topic }))}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block size="large" style={{ borderRadius: 6 }}>
            发布
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
