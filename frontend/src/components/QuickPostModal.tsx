'use client';

import { useState } from 'react';
import { Modal, Input, Button, Space, Tag, Select, Typography, Radio, App } from 'antd';
import type { RadioChangeEvent } from 'antd';
import { SendOutlined, FileTextOutlined, ShareAltOutlined, RocketOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import { communityApi } from '@/lib/api/community';
import { useAuthStore } from '@/store/authStore';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface QuickPostModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { id: 'tech', name: '技术讨论', icon: '💻', description: '论文解读、技术探讨、问题求助' },
  { id: 'resource', name: '资源分享', icon: '📦', description: '项目、模型、工具、教程' },
  { id: 'activity', name: '活动交流', icon: '🎯', description: '会议、比赛、线下活动' },
];

const POST_TEMPLATES = [
  { 
    key: 'quick', 
    label: '快速发帖', 
    icon: 'SendOutlined',
    placeholder: '分享你的想法、提问或讨论...',
    minLength: 10
  },
  { 
    key: 'paper', 
    label: '论文解读', 
    icon: 'FileTextOutlined',
    placeholder: '论文标题\n\n核心观点：\n1. \n2. \n3. \n\n个人见解：',
    category: 'tech',
    minLength: 20
  },
  { 
    key: 'resource', 
    label: '资源分享', 
    icon: 'ShareAltOutlined',
    placeholder: '资源名称\n\n资源链接：\n\n推荐理由：\n1. \n2. \n3. \n\n适用场景：',
    category: 'resource',
    minLength: 20
  },
  { 
    key: 'question', 
    label: '技术求助', 
    icon: 'RocketOutlined',
    placeholder: '问题描述：\n\n已尝试的方法：\n\n期望的解决方案：',
    category: 'tech',
    minLength: 15
  },
  { 
    key: 'activity', 
    label: '活动发布', 
    icon: 'CalendarOutlined',
    placeholder: '活动名称\n\n活动时间：\n\n活动地点：\n\n活动内容：\n\n报名方式：',
    category: 'activity',
    minLength: 20
  },
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
  activity: ['学术会议', '技术沙龙', '黑客松', '比赛', '线下聚会', '线上直播'],
};

export default function QuickPostModal({ open, onClose, onSuccess }: QuickPostModalProps) {
  const [activeTab, setActiveTab] = useState('quick');
  const [selectedCategory, setSelectedCategory] = useState<string>('tech');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const getErrorMessage = (error: unknown, fallback: string) => (
    error instanceof Error ? error.message : fallback
  );

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const template = POST_TEMPLATES.find(t => t.key === key);
    if (template && template.placeholder) {
      setContent(template.placeholder);
    }
    if (template && template.category) {
      setSelectedCategory(template.category);
    }
  };

  const handleCategoryChange = (e: RadioChangeEvent) => {
    setSelectedCategory(String(e.target.value));
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

    const currentTemplate = POST_TEMPLATES.find(t => t.key === activeTab);
    const minLength = currentTemplate?.minLength || 10;
    
    if (content.trim().length < minLength) {
      message.warning(`内容至少需要${minLength}个字符`);
      return;
    }

    if (content.trim().length > 5000) {
      message.warning('内容不能超过5000个字符');
      return;
    }

    setLoading(true);
    try {
      await communityApi.createPost({
        contentType: selectedCategory,
        title: title || undefined,
        content: content.trim(),
        tags,
      });

      message.success('发布成功！+10积分');
      setContent('');
      setTitle('');
      setTags([]);
      setActiveTab('quick');
      setSelectedCategory('tech');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '发布失败'));
    } finally {
      setLoading(false);
    }
  };

  const currentSuggestedTags = SUGGESTED_TAGS[selectedCategory as keyof typeof SUGGESTED_TAGS] || [];

  return (
    <Modal
      title={
        <Space>
          <SendOutlined style={{ color: '#262626', fontSize: 16 }} />
          <span style={{ fontSize: 15, fontWeight: 500 }}>发布内容</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            发布可获得+10积分
          </Text>
          <Space>
            <Button onClick={onClose} size="small">取消</Button>
            <Button 
              type="primary" 
              onClick={handleSubmit} 
              loading={loading}
              icon={<SendOutlined />}
              size="small"
              style={{ background: '#262626', borderColor: '#262626' }}
            >
              发布
            </Button>
          </Space>
        </Space>
      }
      width={600}
      styles={{
        body: { padding: '20px' }
      }}
      destroyOnHidden
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
          选择模板（可选）
        </Text>
        <Space wrap size={8}>
          {POST_TEMPLATES.map((template) => (
            <Button
              key={template.key}
              type={activeTab === template.key ? 'primary' : 'default'}
              icon={ICON_MAP[template.icon] as React.ReactNode}
              onClick={() => handleTabChange(template.key)}
              size="small"
              style={{ borderRadius: 6, fontSize: 12 }}
            >
              {template.label}
            </Button>
          ))}
        </Space>
        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
          提示：选择模板可快速填充内容格式，也可直接输入
        </Text>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
          分类
        </Text>
        <Radio.Group
          value={selectedCategory}
          onChange={handleCategoryChange}
          style={{ width: '100%' }}
          size="small"
        >
          <Space wrap size={6}>
            {CATEGORIES.map((category) => (
              <Radio.Button 
                key={category.id} 
                value={category.id}
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                {category.icon} {category.name}
              </Radio.Button>
            ))}
          </Space>
        </Radio.Group>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
          内容 <Text type="secondary" style={{ fontSize: 11, fontWeight: 'normal' }}>（必填）</Text>
        </Text>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={POST_TEMPLATES.find(t => t.key === activeTab)?.placeholder || '分享你的想法、提问或讨论...'}
          rows={8}
          maxLength={5000}
          showCount
          autoSize={{ minRows: 6, maxRows: 12 }}
          style={{ fontSize: 14 }}
        />
      </div>

      <div>
        <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
          标签 <Text type="secondary" style={{ fontSize: 11, fontWeight: 'normal' }}>（可选，最多5个）</Text>
        </Text>
        <Select
          mode="tags"
          placeholder="输入标签后按回车添加"
          value={tags}
          onChange={(value) => {
            if (value.length <= 5) {
              setTags(value);
            } else {
              message.warning('最多只能添加5个标签');
            }
          }}
          options={currentSuggestedTags.map(tag => ({ label: tag, value: tag }))}
          style={{ width: '100%' }}
          size="small"
          maxTagCount="responsive"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
        {tags.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <Space wrap size={4}>
              {tags.map((tag) => (
                <Tag 
                  key={tag} 
                  closable 
                  onClose={() => setTags(tags.filter(t => t !== tag))}
                  style={{ borderRadius: 4, fontSize: 11, margin: 0 }}
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
