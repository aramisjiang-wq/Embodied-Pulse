'use client';

import { Modal, Tabs, Input, Space, Button, Typography, Card, Row, Col, Divider, App } from 'antd';
import { useState, useEffect } from 'react';
import { 
  TwitterOutlined, 
  FacebookOutlined, 
  LinkOutlined, 
  WechatOutlined, 
  CopyOutlined, 
  SendOutlined,
  QrcodeOutlined,
  ShareAltOutlined,
  MailOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Paragraph, Text } = Typography;

export interface ShareTemplate {
  key: string;
  label: string;
  title: string;
  content: string;
  icon?: React.ReactNode;
}

const buildTemplates = (title?: string, url?: string): ShareTemplate[] => [
  {
    key: 'summary',
    label: '一句话总结',
    title: '一句话总结',
    icon: <ShareAltOutlined style={{ color: '#1890ff' }} />,
    content: `分享一个很棒的内容：${title || '内容'}。\n亮点：观点清晰、信息密度高。\n${url ? `链接：${url}` : ''}`,
  },
  {
    key: 'insight',
    label: '关键洞察',
    title: '关键洞察',
    icon: <SendOutlined style={{ color: '#52c41a' }} />,
    content: `这篇内容让我印象最深的是：\n1) 关键问题切得很准\n2) 方法清晰可复用\n3) 结果具有启发性\n${url ? `链接：${url}` : ''}`,
  },
  {
    key: 'ask',
    label: '求推荐',
    title: '求推荐',
    icon: <WechatOutlined style={{ color: '#722ed1' }} />,
    content: `我最近在研究相关方向，想请教大家：\n还有哪些类似的资源或项目值得关注？\n${url ? `原内容链接：${url}` : ''}`,
  },
  {
    key: 'action',
    label: '行动清单',
    title: '行动清单',
    icon: <LinkOutlined style={{ color: '#fa8c16' }} />,
    content: `看完后我的行动清单：\n- 复现关键方法\n- 记录关键参数\n- 整理实践心得\n${url ? `参考链接：${url}` : ''}`,
  },
  {
    key: 'resource',
    label: '资料分享',
    title: '资料分享',
    icon: <MailOutlined style={{ color: '#13c2c2' }} />,
    content: `分享一个高质量资料：${title || '内容'}\n适合：入门/进阶/复现\n${url ? `链接：${url}` : ''}`,
  },
  {
    key: 'custom',
    label: '自定义',
    title: '自定义分享',
    icon: <CopyOutlined style={{ color: '#8c8c8c' }} />,
    content: '',
  },
];

interface ShareModalProps {
  open: boolean;
  title?: string;
  url?: string;
  onPublish?: (content: string) => Promise<void>;
  onClose: () => void;
}

export default function ShareModal({ open, title, url, onPublish, onClose }: ShareModalProps) {
  const templates = buildTemplates(title, url);
  const [activeKey, setActiveKey] = useState<string>(templates[0].key);
  const [customContent, setCustomContent] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareMethod, setShareMethod] = useState<'community' | 'social' | 'link'>('community');
  const { message } = App.useApp();

  useEffect(() => {
    if (open) {
      setActiveKey(templates[0].key);
      setCustomContent('');
      setCopied(false);
    }
  }, [open, templates]);

  const currentTemplate = templates.find((t) => t.key === activeKey) || templates[0];
  const content = activeKey === 'custom' ? customContent : currentTemplate.content;

  const handleCopy = async () => {
    if (!content.trim()) {
      message.warning('分享内容不能为空');
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      message.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      message.error('复制失败，请手动复制');
    }
  };

  const handlePublish = async () => {
    if (!onPublish) {
      return;
    }
    if (!content.trim()) {
      message.warning('分享内容不能为空');
      return;
    }
    setPublishing(true);
    try {
      await onPublish(content);
      message.success('已发布到市集');
      handleClose();
    } catch (error: unknown) {
      message.error(error instanceof Error ? error.message : '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  const handleClose = () => {
    setActiveKey(templates[0].key);
    setCustomContent('');
    setCopied(false);
    onClose();
  };

  const shareLinks = [
    {
      key: 'twitter',
      name: 'Twitter',
      icon: <TwitterOutlined style={{ color: '#1DA1F2' }} />,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title || '内容'} ${url || ''}`)}`,
    },
    {
      key: 'facebook',
      name: 'Facebook',
      icon: <FacebookOutlined style={{ color: '#4267B2' }} />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || '')}`,
    },
    {
      key: 'linkedin',
      name: 'LinkedIn',
      icon: <ShareAltOutlined style={{ color: '#0077B5' }} />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url || '')}`,
    },
    {
      key: 'weibo',
      name: '微博',
      icon: <WechatOutlined style={{ color: '#E6162D' }} />,
      url: `https://service.weibo.com/share/share.php?title=${encodeURIComponent(title || '')}&url=${encodeURIComponent(url || '')}`,
    },
  ];

  const handleSocialShare = (shareUrl: string, platform: string) => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    message.success(`正在打开${platform}分享页面`);
  };

  const handleGenerateQRCode = () => {
    if (!url) {
      message.warning('暂无链接可生成二维码');
      return;
    }
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    window.open(qrUrl, '_blank');
  };

  return (
    <Modal
      title="分享内容"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={720}
    >
      <Tabs
        activeKey={shareMethod}
        onChange={(key) => setShareMethod(key as 'community' | 'social' | 'link')}
        items={[
          {
            key: 'community',
            label: (
              <span>
                <SendOutlined />
                发布到市集
              </span>
            ),
            children: (
              <div>
                <Tabs
                  activeKey={activeKey}
                  onChange={setActiveKey}
                  type="card"
                  size="small"
                  style={{ marginBottom: 16 }}
                >
                  {templates.map((template) => (
                    <Tabs.TabPane
                      tab={
                        <Space size="small">
                          {template.icon}
                          <span>{template.label}</span>
                        </Space>
                      }
                      key={template.key}
                    />
                  ))}
                </Tabs>

                <Card size="small" style={{ marginBottom: 16 }}>
                  <Paragraph strong style={{ marginBottom: 8 }}>
                    {currentTemplate.title}
                  </Paragraph>
                  {activeKey !== 'custom' ? (
                    <TextArea
                      value={content}
                      rows={6}
                      readOnly
                      style={{ background: '#fafafa' }}
                    />
                  ) : (
                    <TextArea
                      value={customContent}
                      onChange={(e) => setCustomContent(e.target.value)}
                      rows={6}
                      placeholder="输入你的分享内容..."
                    />
                  )}
                </Card>

                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button
                    icon={copied ? <CopyOutlined /> : <CopyOutlined />}
                    onClick={handleCopy}
                    type={copied ? 'primary' : 'default'}
                  >
                    {copied ? '已复制' : '复制分享内容'}
                  </Button>
                  {onPublish && (
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handlePublish}
                      loading={publishing}
                    >
                      {publishing ? '发布中...' : '发布到市集'}
                    </Button>
                  )}
                  <Button onClick={handleClose}>关闭</Button>
                </Space>
              </div>
            ),
          },
          {
            key: 'social',
            label: (
              <span>
                <ShareAltOutlined />
                社交媒体
              </span>
            ),
            children: (
              <div>
                <Row gutter={[16, 16]}>
                  {shareLinks.map((link) => (
                    <Col xs={12} sm={8} md={6} key={link.key}>
                      <Card
                        hoverable
                        onClick={() => handleSocialShare(link.url, link.name)}
                        style={{ textAlign: 'center', cursor: 'pointer' }}
                      >
                        <Space direction="vertical" size={8}>
                          <div style={{ fontSize: 32 }}>{link.icon}</div>
                          <Text strong>{link.name}</Text>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>

                <Divider />

                <Card size="small" title="直接链接">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Input
                      value={url || ''}
                      readOnly
                      addonAfter={
                        <Button
                          type="text"
                          icon={<CopyOutlined />}
                          onClick={handleCopy}
                          size="small"
                        >
                          复制
                        </Button>
                      }
                    />
                    <Button
                      block
                      icon={<QrcodeOutlined />}
                      onClick={handleGenerateQRCode}
                    >
                      生成二维码
                    </Button>
                  </Space>
                </Card>
              </div>
            ),
          },
          {
            key: 'link',
            label: (
              <span>
                <LinkOutlined />
                复制链接
              </span>
            ),
            children: (
              <div>
                <Card size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Paragraph>
                      <Text strong>内容标题：</Text>
                      <br />
                      <Text type="secondary">{title || '-'}</Text>
                    </Paragraph>
                    <Divider style={{ margin: '12px 0' }} />
                    <Paragraph>
                      <Text strong>分享链接：</Text>
                      <br />
                      <Input
                        value={url || ''}
                        readOnly
                        addonAfter={
                          <Button
                            type="text"
                            icon={copied ? <CopyOutlined /> : <CopyOutlined />}
                            onClick={handleCopy}
                            size="small"
                          >
                            {copied ? '已复制' : '复制'}
                          </Button>
                        }
                      />
                    </Paragraph>
                    <Button
                      block
                      type="primary"
                      icon={copied ? <CopyOutlined /> : <CopyOutlined />}
                      onClick={handleCopy}
                      size="large"
                    >
                        {copied ? '已复制到剪贴板' : '复制链接到剪贴板'}
                      </Button>
                  </Space>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
}
