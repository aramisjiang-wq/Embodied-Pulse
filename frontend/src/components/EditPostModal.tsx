'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Button, Space, Tag, Select, Typography, Radio, App } from 'antd';
import { EditOutlined, SendOutlined, FileTextOutlined, ShareAltOutlined, RocketOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import { communityApi } from '@/lib/api/community';
import { useAuthStore } from '@/store/authStore';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface EditPostModalProps {
  open: boolean;
  postId: string;
  initialData?: {
    title?: string;
    content: string;
    contentType: string;
    tags?: string[];
  };
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: 'tech', name: '技术讨论', icon: '💻', description: '论文解读、技术探讨、问题求助' },
  { id: 'resource', name: '资源分享', icon: '📦', description: '项目、模型、工具、教程' },
  { id: 'jobs', name: '求职招聘', icon: '💼', description: '招聘信息、求职需求' },
  { id: 'activity', name: '活动交流', icon: '🎯', description: '会议、比赛、线下活动' },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  SendOutlined: <SendOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  ShareAltOutlined: <ShareAltOutlined />,
  RocketOutlined: <RocketOutlined />,
  TeamOutlined: <TeamOutlined />,
  CalendarOutlined: <CalendarOutlined />,
};

const SUGGESTED_TAGS = {
  tech: ['具身智能', '机器人学习', '多模态', '强化学习', '计算机视觉', '自然语言处理', '深度学习', '论文解读'],
  resource: ['开源项目', '数据集', '预训练模型', '工具库', '教程', '文档', '代码示例'],
  jobs: ['全职', '实习', '远程', '校招', '社招', '算法工程师', '研发工程师', '产品经理'],
  activity: ['学术会议', '技术沙龙', '黑客松', '比赛', '线下聚会', '线上直播'],
};

export default function EditPostModal({ open, postId, initialData, onClose, onSuccess }: EditPostModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('tech');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const { user } = useAuthStore();

  useEffect(() => {
    if (open && initialData) {
      setContent(initialData.content);
      setTitle(initialData.title || '');
      setSelectedCategory(initialData.contentType);
      setTags(initialData.tags || []);
    }
  }, [open, initialData]);

  const handleCategoryChange = (e: any) => {
    setSelectedCategory(e.target.value);
  };

  const handleSubmit = async () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }

    if (!content.trim()) {
      message.warning('请输入内容');
      return;
    }

    if (content.trim().length < 10) {
      message.warning('内容至少需要10个字符');
      return;
    }

    if (content.trim().length > 5000) {
      message.warning('内容不能超过5000个字符');
      return;
    }

    if (selectedCategory === 'jobs' && !title.trim()) {
      message.warning('请输入标题');
      return;
    }

    setLoading(true);
    try {
      await communityApi.updatePost(postId, {
        contentType: selectedCategory,
        title: title || undefined,
        content: content.trim(),
        tags,
      });

      message.success('修改成功');
      setContent('');
      setTitle('');
      setTags([]);
      setSelectedCategory('tech');
      onSuccess();
      onClose();
    } catch (error: any) {
      message.error(error.message || '修改失败');
    } finally {
      setLoading(false);
    }
  };

  const currentSuggestedTags = SUGGESTED_TAGS[selectedCategory as keyof typeof SUGGESTED_TAGS] || [];

  return (
    <Modal
      title={
        <Space>
          <EditOutlined style={{ color: '#1890ff' }} />
          <span>编辑帖子</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>取消</Button>
          <Button 
            type="primary" 
            onClick={handleSubmit} 
            loading={loading}
            icon={<EditOutlined />}
          >
            保存修改
          </Button>
        </Space>
      }
      width={680}
      destroyOnHidden
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          选择分类
        </Text>
        <Radio.Group
          value={selectedCategory}
          onChange={handleCategoryChange}
          style={{ width: '100%' }}
        >
          <Space wrap size={8}>
            {CATEGORIES.map((category) => (
              <Radio.Button 
                key={category.id} 
                value={category.id}
                style={{ borderRadius: 20 }}
              >
                {category.icon} {category.name}
              </Radio.Button>
            ))}
          </Space>
        </Radio.Group>
        <Paragraph 
          type="secondary" 
          style={{ fontSize: 12, margin: '8px 0 0 0' }}
        >
          {CATEGORIES.find(c => c.id === selectedCategory)?.description}
        </Paragraph>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          标题
        </Text>
        <Input
          placeholder="标题（可选）"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          showCount
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          内容
        </Text>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="编辑你的内容..."
          rows={10}
          maxLength={5000}
          showCount
        />
      </div>

      <div>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          标签
        </Text>
        <Select
          mode="tags"
          placeholder="添加标签（最多5个）"
          value={tags}
          onChange={(value) => {
            if (value.length <= 5) {
              setTags(value);
            }
          }}
          options={currentSuggestedTags.map(tag => ({ label: tag, value: tag }))}
          style={{ width: '100%' }}
          maxTagCount="responsive"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
        {tags.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Space wrap size={4}>
              {tags.map((tag) => (
                <Tag 
                  key={tag} 
                  color="blue" 
                  closable 
                  onClose={() => setTags(tags.filter(t => t !== tag))}
                  style={{ borderRadius: 12 }}
                >
                  {tag}
                </Tag>
              ))}
            </Space>
          </div>
        )}
      </div>
    </Modal>
  );
}
