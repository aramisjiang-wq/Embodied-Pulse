/**
 * 收藏管理页面
 */

'use client';

import { useEffect, useState } from 'react';
import { Layout, Card, Button, Space, Tag, Empty, Spin, Tabs, Row, Col, message, Input, Modal, Form, Select, Popconfirm, Dropdown, MenuProps, Badge, Checkbox, App } from 'antd';
import { 
  StarOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  GithubOutlined,
  RobotOutlined,
  TeamOutlined,
  LinkOutlined,
  FolderOutlined,
  FolderAddOutlined,
  SearchOutlined,
  DeleteOutlined,
  MoreOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import { paperApi } from '@/lib/api/paper';
import { videoApi } from '@/lib/api/video';
import { repoApi } from '@/lib/api/repo';
import { jobApi } from '@/lib/api/job';
import { huggingfaceApi } from '@/lib/api/huggingface';
import dayjs from 'dayjs';
import { SmartCategories } from '@/components/SmartCategories';

const { Content } = Layout;

export interface FavoriteFolder {
  id: string;
  name: string;
  description?: string;
  favoriteIds: string[];
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export default function FavoritesPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FavoriteFolder | null>(null);
  const [selectedFavorites, setSelectedFavorites] = useState<Set<string>>(new Set());
  const [folderForm] = Form.useForm();

  useEffect(() => {
    if (!user) {
      messageApi.warning('请先登录');
      router.push('/login');
      return;
    }
    loadFavorites();
    loadFolders();
  }, [user, activeTab, selectedFolder]);

  const loadFolders = () => {
    const saved = localStorage.getItem('favoriteFolders');
    if (saved) {
      try {
        setFolders(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading folders:', error);
        setFolders([]);
      }
    }
  };

  const saveFolders = (newFolders: FavoriteFolder[]) => {
    setFolders(newFolders);
    localStorage.setItem('favoriteFolders', JSON.stringify(newFolders));
  };

  const handleCreateFolder = () => {
    setEditingFolder(null);
    folderForm.resetFields();
    setFolderModalVisible(true);
  };

  const handleEditFolder = (folder: FavoriteFolder) => {
    setEditingFolder(folder);
    folderForm.setFieldsValue({
      name: folder.name,
      description: folder.description,
      color: folder.color || 'blue',
    });
    setFolderModalVisible(true);
  };

  const handleDeleteFolder = (folderId: string) => {
    const newFolders = folders.filter(f => f.id !== folderId);
    saveFolders(newFolders);
    if (selectedFolder === folderId) {
      setSelectedFolder(null);
    }
    messageApi.success('收藏夹已删除');
  };

  const handleFolderSubmit = async (values: any) => {
    if (editingFolder) {
      const updatedFolders = folders.map(f => 
        f.id === editingFolder.id 
          ? { ...f, ...values, updatedAt: new Date().toISOString() }
          : f
      );
      saveFolders(updatedFolders);
      messageApi.success('收藏夹更新成功');
    } else {
      const newFolder: FavoriteFolder = {
        id: `folder_${Date.now()}`,
        name: values.name,
        description: values.description,
        color: values.color || 'blue',
        favoriteIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveFolders([...folders, newFolder]);
      messageApi.success('收藏夹创建成功');
    }
    setFolderModalVisible(false);
    folderForm.resetFields();
  };

  const handleAddToFolder = (favoriteId: string, folderId: string) => {
    const updatedFolders = folders.map(f => 
      f.id === folderId 
        ? { ...f, favoriteIds: [...f.favoriteIds, favoriteId], updatedAt: new Date().toISOString() }
        : f
    );
    saveFolders(updatedFolders);
    messageApi.success('已添加到收藏夹');
  };

  const handleRemoveFromFolder = (favoriteId: string, folderId: string) => {
    const updatedFolders = folders.map(f => 
      f.id === folderId 
        ? { ...f, favoriteIds: f.favoriteIds.filter(id => id !== favoriteId), updatedAt: new Date().toISOString() }
        : f
    );
    saveFolders(updatedFolders);
    messageApi.success('已从收藏夹移除');
  };

  const handleBatchAction = async (action: string) => {
    if (selectedFavorites.size === 0) {
      messageApi.warning('请先选择收藏');
      return;
    }

    try {
      const ids = Array.from(selectedFavorites);

      switch (action) {
        case 'delete':
          for (const id of ids) {
            const fav = favorites.find(f => f.id === id);
            if (fav) {
              await communityApi.deleteFavorite(fav.contentType, fav.contentId);
            }
          }
          messageApi.success(`已删除 ${ids.length} 个收藏`);
          break;
        case 'addToFolder':
          if (!selectedFolder) {
            messageApi.warning('请先选择收藏夹');
            return;
          }
          ids.forEach(id => handleAddToFolder(id, selectedFolder));
          messageApi.success('批量添加到收藏夹成功');
          break;
      }

      setSelectedFavorites(new Set());
      loadFavorites();
    } catch (error: any) {
      messageApi.error(error.message || '批量操作失败');
    }
  };

  const getFilteredFavorites = () => {
    let filtered = favorites;

    if (searchKeyword) {
      filtered = filtered.filter(fav => 
        fav.detail?.title?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        fav.detail?.description?.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }

    if (selectedFolder) {
      const folder = folders.find(f => f.id === selectedFolder);
      if (folder) {
        filtered = filtered.filter(fav => folder.favoriteIds.includes(fav.id));
      }
    }

    return filtered;
  };

  const getBatchMenuItems: MenuProps['items'] = [
    {
      key: 'delete',
      label: '批量删除',
      icon: <DeleteOutlined />,
      danger: true,
    },
    {
      key: 'addToFolder',
      label: '添加到收藏夹',
      icon: <FolderOutlined />,
    },
  ];

  const loadFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const params: any = {
        page: 1,
        size: 100,
      };
      
      if (activeTab !== 'all') {
        params.type = activeTab;
      }
      
      console.log('Loading favorites with params:', params);
      const data = await communityApi.getFavorites(params);
      console.log('Favorites API response:', data);
      
      let favoritesList: any[] = [];
      if (Array.isArray(data)) {
        favoritesList = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.items)) {
          favoritesList = data.items;
        }
      }
      
      console.log('Parsed favorites:', favoritesList);
      
      const enriched = await Promise.all(
        favoritesList.map(async (fav: any) => {
          try {
            switch (fav.contentType) {
              case 'paper':
                return { ...fav, detail: await paperApi.getPaper(fav.contentId) };
              case 'video':
                return { ...fav, detail: await videoApi.getVideo(fav.contentId) };
              case 'repo':
                return { ...fav, detail: await repoApi.getRepo(fav.contentId) };
              case 'job':
                return { ...fav, detail: await jobApi.getJob(fav.contentId) };
              case 'huggingface':
                return { ...fav, detail: await huggingfaceApi.getModel(fav.contentId) };
              default:
                return fav;
            }
          } catch (error) {
            console.error('Error loading favorite detail:', error);
            return fav;
          }
        })
      );
      
      setFavorites(enriched);
    } catch (error: any) {
      console.error('Load favorites error:', error);
      if (error.status === 401 || error.code === 'UNAUTHORIZED') {
        messageApi.error('未登录或登录已过期，请重新登录');
        router.push('/login');
      } else if (error.code === 'CONNECTION_REFUSED' || error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR') {
        messageApi.error('后端服务未运行，请确保后端服务已启动');
      } else {
        messageApi.error(error.message || '加载收藏失败');
      }
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (favoriteId: string) => {
    try {
      const fav = favorites.find(f => f.id === favoriteId);
      if (!fav) return;
      
      await communityApi.deleteFavorite(fav.contentType, fav.contentId);
      messageApi.success('已取消收藏');
      loadFavorites();
    } catch (error: any) {
      messageApi.error(error.message || '取消收藏失败');
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'paper':
        return <FileTextOutlined />;
      case 'video':
        return <PlayCircleOutlined />;
      case 'repo':
        return <GithubOutlined />;
      case 'huggingface':
        return <RobotOutlined />;
      case 'job':
        return <TeamOutlined />;
      default:
        return <StarOutlined />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      paper: '论文',
      video: '视频',
      repo: 'GitHub项目',
      huggingface: 'HuggingFace模型',
      job: '招聘岗位',
    };
    return labels[type] || type;
  };

  const getContentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      paper: 'blue',
      video: 'green',
      repo: 'purple',
      huggingface: 'orange',
      job: 'red',
    };
    return colors[type] || 'default';
  };

  const buildLink = (fav: any) => {
    const detail = fav.detail;
    if (!detail) return '#';
    
    switch (fav.contentType) {
      case 'paper':
        return detail.arxivId ? `https://arxiv.org/abs/${detail.arxivId}` : (detail.pdfUrl || '#');
      case 'video':
        return detail.platform === 'bilibili'
          ? `https://www.bilibili.com/video/${detail.videoId || detail.bvid || ''}`
          : detail.platform === 'youtube'
            ? `https://www.youtube.com/watch?v=${detail.videoId || ''}`
            : '#';
      case 'repo':
        return detail.htmlUrl || (detail.fullName ? `https://github.com/${detail.fullName}` : '#');
      case 'job':
        return detail.applyUrl || 'https://github.com/StarCycle/Awesome-Embodied-AI-Job';
      case 'huggingface':
        return detail.fullName ? `https://huggingface.co/${detail.fullName}` : (detail.hfId ? `https://huggingface.co/${detail.hfId}` : '#');
      case 'news':
        return detail.url || '#';
      default:
        return '#';
    }
  };

  const formatRelativeTime = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    return dayjs(date).fromNow();
  };

  const groupedFavorites = favorites.reduce((acc, fav) => {
    if (!acc[fav.contentType]) {
      acc[fav.contentType] = [];
    }
    acc[fav.contentType].push(fav);
    return acc;
  }, {} as Record<string, any[]>);

  const stats = {
    total: favorites.length,
    paper: groupedFavorites.paper?.length || 0,
    video: groupedFavorites.video?.length || 0,
    repo: groupedFavorites.repo?.length || 0,
    huggingface: groupedFavorites.huggingface?.length || 0,
    job: groupedFavorites.job?.length || 0,
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {contextHolder}
      <div style={{ background: '#f5f7fa', minHeight: 'calc(100vh - 64px)' }}>
        <Content style={{ padding: '20px 50px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ 
            marginBottom: 20,
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: '#262626' }}>我的收藏</h1>
              <p style={{ color: '#8c8c8c', marginBottom: 0, fontSize: 14 }}>
                管理你收藏的优质内容
              </p>
            </div>
            <Button 
              type="primary" 
              icon={<FolderAddOutlined />}
              onClick={handleCreateFolder}
            >
              新建收藏夹
            </Button>
          </div>

          <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} md={6}>
            <Card 
              size="small"
              style={{ borderLeft: '3px solid #1890ff' }}
              bodyStyle={{ padding: '12px 8px' }}
            >
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                {stats.total}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>总收藏</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              size="small"
              style={{ borderLeft: '3px solid #52c41a' }}
              bodyStyle={{ padding: '12px 8px' }}
            >
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>
                {stats.paper}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>论文</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              size="small"
              style={{ borderLeft: '3px solid #722ed1' }}
              bodyStyle={{ padding: '12px 8px' }}
            >
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#722ed1' }}>
                {stats.video}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>视频</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card 
              size="small"
              style={{ borderLeft: '3px solid #fa8c16' }}
              bodyStyle={{ padding: '12px 8px' }}
            >
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#fa8c16' }}>
                {stats.repo}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>项目</div>
            </Card>
          </Col>
        </Row>

        {/* 智能分类 */}
        {favorites.length > 0 && (
          <SmartCategories 
            favorites={favorites}
            onSelectCategory={(categoryId) => {
              if (categoryId.startsWith('type_')) {
                setActiveTab(categoryId.replace('type_', ''));
              } else if (categoryId.startsWith('tag_')) {
                setSearchKeyword(categoryId.replace('tag_', ''));
              } else if (categoryId.startsWith('keyword_')) {
                setSearchKeyword(categoryId.replace('keyword_', ''));
              } else if (categoryId === 'recent') {
                const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const recentFavorites = favorites.filter(f => new Date(f.createdAt) > oneWeekAgo);
                setFavorites(recentFavorites);
              } else if (categoryId === 'month') {
                const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const monthFavorites = favorites.filter(f => {
                  const date = new Date(f.createdAt);
                  return date > oneMonthAgo && date <= oneWeekAgo;
                });
                setFavorites(monthFavorites);
              }
            }}
          />
        )}

        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <Space wrap>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  { key: 'all', label: '全部' },
                  { key: 'paper', label: '论文', icon: <FileTextOutlined /> },
                  { key: 'video', label: '视频', icon: <PlayCircleOutlined /> },
                  { key: 'repo', label: 'GitHub', icon: <GithubOutlined /> },
                  { key: 'huggingface', label: 'HuggingFace', icon: <RobotOutlined /> },
                  { key: 'job', label: '招聘', icon: <TeamOutlined /> },
                ]}
              />
              
              {folders.length > 0 && (
                <Select
                  placeholder="选择收藏夹"
                  style={{ width: 150 }}
                  allowClear
                  value={selectedFolder}
                  onChange={setSelectedFolder}
                  options={[
                    { value: null, label: '全部收藏夹' },
                    ...folders.map(f => ({ value: f.id, label: f.name })),
                  ]}
                />
              )}
            </Space>

            <Space>
              <Input
                placeholder="搜索收藏"
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                allowClear
              />
              
              {selectedFavorites.size > 0 && (
                <Badge count={selectedFavorites.size} offset={[10, 0]}>
                  <Dropdown menu={{ items: getBatchMenuItems, onClick: ({ key }) => handleBatchAction(key) }}>
                    <Button>
                      批量操作 <MoreOutlined />
                    </Button>
                  </Dropdown>
                </Badge>
              )}
              
              <Button
                icon={viewMode === 'card' ? <UnorderedListOutlined /> : <AppstoreOutlined />}
                onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
              >
                {viewMode === 'card' ? '列表' : '卡片'}
              </Button>
              
              <Button
                icon={<FolderAddOutlined />}
                onClick={handleCreateFolder}
              >
                新建收藏夹
              </Button>
            </Space>
          </div>
        </Card>

        <Spin spinning={loading}>
          {getFilteredFavorites().length === 0 ? (
            <Card>
              <Empty
                description="暂无收藏"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          ) : (
            <>
              {viewMode === 'card' ? (
                <Row gutter={[16, 16]}>
                  {getFilteredFavorites().map((favorite) => {
                    const detail = favorite.detail;
                    const linkUrl = buildLink(favorite);
                    const isExternal = !linkUrl.startsWith('/') && linkUrl !== '#';
                    const isSelected = selectedFavorites.has(favorite.id);
                    const folder = folders.find(f => f.favoriteIds.includes(favorite.id));

                    return (
                      <Col xs={24} sm={12} md={8} key={favorite.id}>
                        <Card
                          hoverable
                          style={{ 
                            borderRadius: 12,
                            border: isSelected ? '2px solid #1890ff' : undefined,
                            position: 'relative',
                          }}
                        >
                          <Checkbox
                            style={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newSelected = new Set(selectedFavorites);
                              if (e.target.checked) {
                                newSelected.add(favorite.id);
                              } else {
                                newSelected.delete(favorite.id);
                              }
                              setSelectedFavorites(newSelected);
                            }}
                          />
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Tag 
                              icon={getContentTypeIcon(favorite.contentType)}
                              color={getContentTypeColor(favorite.contentType)}
                              style={{ fontSize: 14, padding: '4px 12px' }}
                            >
                              {getContentTypeLabel(favorite.contentType)}
                            </Tag>
                            {folder && (
                              <Tag icon={<FolderOutlined />} color={folder.color}>
                                {folder.name}
                              </Tag>
                            )}
                          </div>

                          <div style={{ marginBottom: 8 }}>
                            <a
                              href={linkUrl}
                              target={isExternal ? '_blank' : undefined}
                              rel={isExternal ? 'noopener noreferrer' : undefined}
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#1890ff',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              {isExternal && <LinkOutlined style={{ fontSize: 12 }} />}
                              <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {detail?.title || detail?.fullName || detail?.name || favorite.contentId}
                              </span>
                            </a>
                          </div>

                          {detail?.description && (
                            <div
                              style={{
                                color: '#595959',
                                fontSize: 12,
                                marginBottom: 12,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.5,
                              }}
                            >
                              {detail.description}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button
                              size="small"
                              danger
                              onClick={() => handleDelete(favorite.id)}
                            >
                              取消收藏
                            </Button>
                          </div>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              ) : (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {getFilteredFavorites().map((favorite) => {
                    const detail = favorite.detail;
                    const linkUrl = buildLink(favorite);
                    const isExternal = !linkUrl.startsWith('/') && linkUrl !== '#';
                    const isSelected = selectedFavorites.has(favorite.id);
                    const folder = folders.find(f => f.favoriteIds.includes(favorite.id));

                    return (
                      <Card
                        key={favorite.id}
                        hoverable
                        style={{ 
                          borderRadius: 12,
                          border: isSelected ? '2px solid #1890ff' : undefined,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newSelected = new Set(selectedFavorites);
                              if (e.target.checked) {
                                newSelected.add(favorite.id);
                              } else {
                                newSelected.delete(favorite.id);
                              }
                              setSelectedFavorites(newSelected);
                            }}
                          />
                          
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                              <Tag 
                                icon={getContentTypeIcon(favorite.contentType)}
                                color={getContentTypeColor(favorite.contentType)}
                                style={{ fontSize: 14, padding: '4px 12px' }}
                              >
                                {getContentTypeLabel(favorite.contentType)}
                              </Tag>
                              <span style={{ color: '#999', fontSize: 12 }}>
                                收藏于 {formatRelativeTime(favorite.createdAt)}
                              </span>
                              {folder && (
                                <Tag icon={<FolderOutlined />} color={folder.color}>
                                  {folder.name}
                                </Tag>
                              )}
                            </div>

                            <div style={{ marginBottom: 8 }}>
                              <a
                                href={linkUrl}
                                target={isExternal ? '_blank' : undefined}
                                rel={isExternal ? 'noopener noreferrer' : undefined}
                                style={{
                                  fontSize: 16,
                                  fontWeight: 600,
                                  color: '#1890ff',
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                {isExternal && <LinkOutlined style={{ fontSize: 14 }} />}
                                <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {detail?.title || detail?.fullName || detail?.name || favorite.contentId}
                                </span>
                              </a>
                            </div>

                            {detail?.description && (
                              <div
                                style={{
                                  color: '#595959',
                                  fontSize: 13,
                                  marginBottom: 12,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.6,
                                }}
                              >
                                {detail.description}
                              </div>
                            )}

                            {detail?.language && favorite.contentType === 'repo' && (
                              <Tag color="geekblue" style={{ fontSize: 11, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>
                                {detail.language}
                              </Tag>
                            )}

                            {detail?.tags && Array.isArray(detail.tags) && detail.tags.length > 0 && (
                              <div style={{ marginTop: 8 }}>
                                {detail.tags.slice(0, 3).map((tag: string, idx: number) => (
                                  <Tag key={idx} color="blue" style={{ fontSize: 11, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', borderRadius: 4, whiteSpace: 'nowrap' }}>
                                    {tag}
                                  </Tag>
                                ))}
                              </div>
                            )}
                          </div>

                          <Button
                            danger
                            onClick={() => handleDelete(favorite.id)}
                          >
                            取消收藏
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </Space>
              )}
            </>
          )}
        </Spin>

        {/* 创建/编辑收藏夹弹窗 */}
        <Modal
          title={editingFolder ? '编辑收藏夹' : '新建收藏夹'}
          open={folderModalVisible}
          onOk={() => folderForm.submit()}
          onCancel={() => {
            setFolderModalVisible(false);
            folderForm.resetFields();
            setEditingFolder(null);
          }}
          width={500}
        >
          <Form
            form={folderForm}
            layout="vertical"
            onFinish={handleFolderSubmit}
          >
            <Form.Item
              name="name"
              label="收藏夹名称"
              rules={[{ required: true, message: '请输入收藏夹名称' }]}
            >
              <Input placeholder="输入收藏夹名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="收藏夹描述"
            >
              <Input.TextArea rows={3} placeholder="输入收藏夹描述（可选）" />
            </Form.Item>

            <Form.Item
              name="color"
              label="收藏夹颜色"
              initialValue="blue"
            >
              <Select>
                <Select.Option value="blue">蓝色</Select.Option>
                <Select.Option value="green">绿色</Select.Option>
                <Select.Option value="purple">紫色</Select.Option>
                <Select.Option value="orange">橙色</Select.Option>
                <Select.Option value="red">红色</Select.Option>
                <Select.Option value="cyan">青色</Select.Option>
                <Select.Option value="magenta">洋红</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </div>
    </>
  );
}
