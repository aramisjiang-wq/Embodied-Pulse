'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Dropdown, Space, App, Modal, Input, Tooltip, Tag, Divider } from 'antd';
import { StarOutlined, StarFilled, BellOutlined, BellFilled, ShareAltOutlined, BookOutlined, FolderAddOutlined, LinkOutlined, CopyOutlined, FileTextOutlined, CompareOutlined, DownloadOutlined, ExportOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { communityApi, subscriptionApi } from '@/lib/api';
import type { Subscription } from '@/lib/api/subscription';

interface QuickActionsProps {
  contentType: 'paper' | 'repo' | 'video' | 'job' | 'post';
  contentId: string;
  title?: string;
  url?: string;
  onShare?: () => void;
  onFavoriteChange?: (isFavorited: boolean) => void;
  onSubscribeChange?: (isSubscribed: boolean) => void;
  showCompare?: boolean;
  showCite?: boolean;
  showDownload?: boolean;
}

export default function QuickActions({
  contentType,
  contentId,
  title,
  url,
  onShare,
  onFavoriteChange,
  onSubscribeChange,
  showCompare = false,
  showCite = false,
  showDownload = false,
}: QuickActionsProps) {
  const { user } = useAuthStore();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState({
    favorite: false,
    subscribe: false,
  });
  const [showCiteModal, setShowCiteModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const { message } = App.useApp();
  const getErrorMessage = (error: unknown, fallback: string) => (
    error instanceof Error ? error.message : fallback
  );

  const loadStates = useCallback(async () => {
    try {
      const [favoriteData, subscriptionData] = await Promise.all([
        communityApi.getFavorites({ page: 1, size: 200, contentType }),
        subscriptionApi.getSubscriptions({ page: 1, size: 200, contentType }),
      ]);

      const favoriteIds = new Set(
        (favoriteData.items || []).flatMap((fav) => {
          if (fav && typeof fav === 'object' && 'contentId' in fav) {
            const contentValue = (fav as { contentId?: unknown }).contentId;
            return typeof contentValue === 'string' ? [contentValue] : [];
          }
          return [];
        })
      );
      const subscriptionIds = new Set(
        (subscriptionData.items || []).flatMap((sub: Subscription) => {
          const contentValue = (sub as { contentId?: unknown }).contentId;
          return typeof contentValue === 'string' ? [contentValue] : [];
        })
      );

      setIsFavorited(favoriteIds.has(contentId));
      setIsSubscribed(subscriptionIds.has(contentId));
    } catch (error) {
      console.error('加载状态失败:', error);
    }
  }, [contentId, contentType]);

  useEffect(() => {
    if (user) {
      loadStates();
    } else {
      setIsFavorited(false);
      setIsSubscribed(false);
    }
  }, [user, loadStates]);

  const handleFavorite = async () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }

    setLoading(prev => ({ ...prev, favorite: true }));
    try {
      if (isFavorited) {
        await communityApi.deleteFavorite(contentType, contentId);
        message.success('已取消收藏');
        setIsFavorited(false);
      } else {
        await communityApi.createFavorite({ contentType, contentId });
        message.success('收藏成功！+2积分');
        setIsFavorited(true);
      }
      onFavoriteChange?.(!isFavorited);
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '操作失败'));
    } finally {
      setLoading(prev => ({ ...prev, favorite: false }));
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }

    setLoading(prev => ({ ...prev, subscribe: true }));
    try {
      if (isSubscribed) {
        await subscriptionApi.deleteSubscription(contentId);
        message.success('已取消订阅');
        setIsSubscribed(false);
      } else {
        await subscriptionApi.createSubscription({
          contentType,
          name: title || '未命名',
        });
        message.success('订阅成功！将为您推送相关更新');
        setIsSubscribed(true);
      }
      onSubscribeChange?.(!isSubscribed);
    } catch (error: unknown) {
      message.error(getErrorMessage(error, '操作失败'));
    } finally {
      setLoading(prev => ({ ...prev, subscribe: false }));
    }
  };

  const handleShare = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    onShare?.();
  };

  const handleCopyLink = () => {
    if (url && typeof window !== 'undefined') {
      navigator.clipboard.writeText(url).then(() => {
        message.success('链接已复制到剪贴板');
      }).catch(() => {
        message.error('复制失败');
      });
    }
  };

  const handleCite = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    setShowCiteModal(true);
  };

  const handleCopyCite = (format: 'bibtex' | 'apa' | 'mla') => {
    let citeText = '';
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    
    switch (format) {
      case 'bibtex':
        citeText = `@article{${contentId},
  title={${title || 'Untitled'}},
  url={${currentUrl}},
  year={${new Date().getFullYear()}}
}`;
        break;
      case 'apa':
        citeText = `${title || 'Untitled'}. (${new Date().getFullYear()}). Retrieved from ${currentUrl}`;
        break;
      case 'mla':
        citeText = `"${title || 'Untitled'}." ${new Date().getFullYear()}, ${currentUrl}.`;
        break;
    }
    
    navigator.clipboard.writeText(citeText).then(() => {
      message.success('引用已复制到剪贴板');
      setShowCiteModal(false);
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const handleAddToFolder = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    setShowFolderModal(true);
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      message.warning('请输入收藏夹名称');
      return;
    }
    message.success(`已添加到收藏夹"${newFolderName}"`);
    setShowFolderModal(false);
    setNewFolderName('');
  };

  const handleCompare = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
    if (compareList.length >= 3) {
      message.warning('最多只能对比3个内容');
      return;
    }
    if (compareList.some((item: any) => item.id === contentId)) {
      message.info('该内容已在对比列表中');
      return;
    }
    compareList.push({ id: contentId, type: contentType, title });
    localStorage.setItem('compareList', JSON.stringify(compareList));
    message.success('已添加到对比列表');
  };

  const favoriteDropdownItems = [
    {
      key: 'favorite',
      label: isFavorited ? '取消收藏' : '收藏',
      icon: isFavorited ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />,
      onClick: handleFavorite,
    },
    {
      key: 'folder',
      label: '收藏到...',
      icon: <FolderAddOutlined />,
      onClick: handleAddToFolder,
    },
    { type: 'divider' as const },
    {
      key: 'subscribe',
      label: isSubscribed ? '取消订阅' : '订阅更新',
      icon: isSubscribed ? <BellFilled style={{ color: '#1890ff' }} /> : <BellOutlined />,
      onClick: handleSubscribe,
    },
  ];

  const shareDropdownItems = [
    {
      key: 'share',
      label: '分享到市集',
      icon: <ShareAltOutlined />,
      onClick: handleShare,
    },
    {
      key: 'copyLink',
      label: '复制链接',
      icon: <LinkOutlined />,
      onClick: handleCopyLink,
    },
  ];

  return (
    <>
      <Space size="small" wrap>
        <Dropdown
          menu={{
            items: favoriteDropdownItems,
            onClick: ({ key }) => {
              const item = favoriteDropdownItems.find(i => 'key' in i && i.key === key);
              if (item && 'onClick' in item) {
                item.onClick();
              }
            },
          }}
          trigger={['click']}
        >
          <Button
            icon={isFavorited ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
            type={isFavorited ? 'primary' : 'default'}
            size="small"
            style={{ borderRadius: 6 }}
          >
            {isFavorited ? '已收藏' : '收藏'}
          </Button>
        </Dropdown>

        <Button
          icon={isSubscribed ? <BellFilled style={{ color: '#1890ff' }} /> : <BellOutlined />}
          onClick={handleSubscribe}
          loading={loading.subscribe}
          type={isSubscribed ? 'primary' : 'default'}
          size="small"
          style={{ borderRadius: 6 }}
        >
          {isSubscribed ? '已订阅' : '订阅'}
        </Button>

        <Dropdown
          menu={{
            items: shareDropdownItems,
            onClick: ({ key }) => {
              const item = shareDropdownItems.find(i => 'key' in i && i.key === key);
              if (item && 'onClick' in item) {
                item.onClick();
              }
            },
          }}
          trigger={['click']}
        >
          <Button
            icon={<ShareAltOutlined />}
            size="small"
            style={{ borderRadius: 6 }}
          >
            分享
          </Button>
        </Dropdown>

        {showCite && (
          <Tooltip title="复制引用格式">
            <Button
              icon={<FileTextOutlined />}
              onClick={handleCite}
              size="small"
              style={{ borderRadius: 6 }}
            >
              引用
            </Button>
          </Tooltip>
        )}

        {showCompare && (
          <Tooltip title="添加到对比列表">
            <Button
              icon={<CompareOutlined />}
              onClick={handleCompare}
              size="small"
              style={{ borderRadius: 6 }}
            >
              对比
            </Button>
          </Tooltip>
        )}
      </Space>

      <Modal
        title="复制引用"
        open={showCiteModal}
        onCancel={() => setShowCiteModal(false)}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>选择引用格式：</div>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <div 
              style={{ 
                padding: '12px 16px', 
                background: '#fafafa', 
                borderRadius: 8, 
                cursor: 'pointer',
                border: '1px solid #f0f0f0'
              }}
              onClick={() => handleCopyCite('bibtex')}
            >
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                <Tag color="blue">BibTeX</Tag>
              </div>
              <code style={{ fontSize: 12, color: '#666' }}>
                @article{'{' + contentId}, title={'{' + (title || 'Untitled') + '}'}, ...}
              </code>
            </div>
            <div 
              style={{ 
                padding: '12px 16px', 
                background: '#fafafa', 
                borderRadius: 8, 
                cursor: 'pointer',
                border: '1px solid #f0f0f0'
              }}
              onClick={() => handleCopyCite('apa')}
            >
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                <Tag color="green">APA</Tag>
              </div>
              <span style={{ fontSize: 12, color: '#666' }}>
                {title || 'Untitled'}. ({new Date().getFullYear()}). Retrieved from...
              </span>
            </div>
            <div 
              style={{ 
                padding: '12px 16px', 
                background: '#fafafa', 
                borderRadius: 8, 
                cursor: 'pointer',
                border: '1px solid #f0f0f0'
              }}
              onClick={() => handleCopyCite('mla')}
            >
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                <Tag color="purple">MLA</Tag>
              </div>
              <span style={{ fontSize: 12, color: '#666' }}>
                "{title || 'Untitled'}." {new Date().getFullYear()}, ...
              </span>
            </div>
          </Space>
        </div>
      </Modal>

      <Modal
        title="收藏到收藏夹"
        open={showFolderModal}
        onCancel={() => setShowFolderModal(false)}
        onOk={handleCreateFolder}
        okText="创建并添加"
      >
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="输入新收藏夹名称"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            prefix={<FolderAddOutlined />}
          />
        </div>
        <Divider style={{ margin: '12px 0' }} />
        <div style={{ color: '#8c8c8c', fontSize: 13 }}>
          💡 收藏夹功能可以帮助您更好地整理和分类收藏的内容
        </div>
      </Modal>
    </>
  );
}
