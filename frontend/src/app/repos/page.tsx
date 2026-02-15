'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Row,
  Col,
  Spin,
  Button,
  Space,
  Select,
  Input,
  Card,
  Empty,
  Tabs,
  Tooltip,
  Skeleton,
  App,
  Pagination,
  Modal,
  Form,
  Tag,
  Divider,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  BarsOutlined,
  GithubOutlined,
  PlusOutlined,
  StarOutlined,
  ForkOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FireOutlined,
  RiseOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { repoApi } from '@/lib/api/repo';
import { GithubRepo } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { contentSubscriptionApi } from '@/lib/api/content-subscription';
import apiClient from '@/lib/api/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Option } = Select;
const { TextArea } = Input;

type ViewMode = 'card' | 'list';

const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

const getLanguageColor = (language: string): string => {
  const colors: Record<string, string> = {
    Python: '#3572A5',
    JavaScript: '#f1e05a',
    TypeScript: '#2b7489',
    'C++': '#f34b7d',
    Java: '#b07219',
    Go: '#00ADD8',
    Rust: '#dea584',
    Lua: '#000080',
    'Jupyter Notebook': '#DA5B0B',
    Shell: '#89e051',
    C: '#555555',
    'C#': '#178600',
  };
  return colors[language] || '#6b7280';
};

export default function ReposPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState<'latest' | 'hot' | 'stars'>('stars');
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState('');
  const [domain, setDomain] = useState<string | undefined>(undefined);
  const [scenario, setScenario] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const { user } = useAuthStore();
  const [subscriptionIds, setSubscriptionIds] = useState<Set<string>>(new Set());
  
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [fetchingRepo, setFetchingRepo] = useState(false);
  const [repoPreview, setRepoPreview] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitForm] = Form.useForm();

  useEffect(() => {
    loadRepos(1);
  }, [sort, language]);

  useEffect(() => {
    if (user) {
      loadSubscriptions();
    } else {
      setSubscriptionIds(new Set());
    }
  }, [user]);

  const loadRepos = async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await repoApi.getRepos({
        page: pageNum,
        size: pageSize,
        sort,
        language,
        keyword: keyword || undefined,
        domain,
        scenario,
      });

      if (!data) {
        setRepos([]);
        setPage(pageNum);
        setTotal(0);
        setHasMore(false);
        return;
      }

      const items = data?.items || [];
      const pagination = data?.pagination || { page: 1, size: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false };

      if (pageNum === 1) {
        setRepos(items);
      } else {
        setRepos((prev) => [...prev, ...items]);
      }

      setPage(pageNum);
      setTotal(pagination.total);
      setHasMore(pagination.hasNext);
    } catch (error: any) {
      console.error('Load repos error:', error);
      message.error(error.message || '加载项目失败');
      if (pageNum === 1) {
        setRepos([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadRepos(1);
  };

  const loadSubscriptions = async () => {
    try {
      const data = await contentSubscriptionApi.getSubscriptions({ page: 1, size: 200, contentType: 'repo' });
      const ids = new Set((data.items || []).map((sub: any) => sub.contentId));
      setSubscriptionIds(ids);
    } catch (error: any) {
      console.error('Load subscriptions error:', error);
    }
  };

  const handleToggleSubscription = (repoId: string) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const already = subscriptionIds.has(repoId);
    const action = already
      ? contentSubscriptionApi.deleteSubscription('repo', repoId)
      : contentSubscriptionApi.createSubscription({ contentType: 'repo', contentId: repoId });
    action
      .then(() => {
        message.success(already ? '已取消订阅' : '订阅成功!');
        loadSubscriptions();
      })
      .catch((error: any) => {
        message.error(error.message || (already ? '取消订阅失败' : '订阅失败'));
      });
  };

  const fetchGitHubRepoInfo = async () => {
    if (!githubUrl.trim()) {
      message.warning('请输入GitHub仓库URL');
      return;
    }

    setFetchingRepo(true);
    try {
      const response = await apiClient.get('/github-repo-info/info', {
        params: { url: githubUrl.trim() },
      });

      if (response.code === 0) {
        setRepoPreview(response.data);
        submitForm.setFieldsValue({
          description: response.data.description || '',
        });
        message.success('获取仓库信息成功！');
      } else {
        message.error(response.message || '获取仓库信息失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || '获取仓库信息失败');
    } finally {
      setFetchingRepo(false);
    }
  };

  const handleSubmitRepo = async (values: any) => {
    if (!repoPreview) {
      message.warning('请先获取仓库信息');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        repoId: repoPreview.repoId,
        fullName: repoPreview.fullName,
        name: repoPreview.name,
        owner: repoPreview.owner,
        description: values.description || repoPreview.description,
        language: repoPreview.language,
        starsCount: repoPreview.starsCount,
        forksCount: repoPreview.forksCount,
        issuesCount: repoPreview.issuesCount,
        topics: repoPreview.topics || [],
        htmlUrl: `https://github.com/${repoPreview.fullName}`,
        createdDate: repoPreview.createdDate,
        updatedDate: repoPreview.updatedDate,
      };

      const response = await apiClient.post('/repos', payload);
      
      if (response.code === 0) {
        message.success('提交成功！感谢您的贡献 🎉');
        setSubmitModalOpen(false);
        setGithubUrl('');
        setRepoPreview(null);
        submitForm.resetFields();
        loadRepos(1);
      } else {
        message.error(response.message || '提交失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || error.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const RepoCard = ({ repo }: { repo: GithubRepo }) => {
    const isFavorited = subscriptionIds.has(repo.id);
    
    return (
      <Card
        hoverable
        style={{
          height: '100%',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid #e8e8e8',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
        }}
        styles={{
          body: {
            padding: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{ padding: '20px 20px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <a
                href={repo.htmlUrl || `https://github.com/${repo.fullName}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <GithubOutlined style={{ fontSize: 18, color: '#24292f' }} />
                  <span style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#24292f',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {repo.name}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#57606a', marginLeft: 26 }}>
                  {repo.owner || repo.fullName?.split('/')[0]}
                </div>
              </a>
            </div>
            {repo.language && (
              <Tag
                style={{
                  background: `${getLanguageColor(repo.language)}15`,
                  color: getLanguageColor(repo.language),
                  border: `1px solid ${getLanguageColor(repo.language)}30`,
                  borderRadius: 6,
                  fontSize: 12,
                  padding: '2px 10px',
                  fontWeight: 500,
                }}
              >
                {repo.language}
              </Tag>
            )}
          </div>

          <div style={{
            fontSize: 13,
            color: '#57606a',
            lineHeight: 1.6,
            marginBottom: 12,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 42,
          }}>
            {repo.description || '暂无描述'}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {repo.topics && Array.isArray(repo.topics) && repo.topics.slice(0, 3).map((topic: string) => (
              <Tag
                key={topic}
                style={{
                  background: '#ddf4ff',
                  color: '#0969da',
                  border: 'none',
                  borderRadius: 16,
                  fontSize: 11,
                  padding: '2px 10px',
                }}
              >
                {topic}
              </Tag>
            ))}
          </div>

          <div style={{ marginTop: 'auto' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              paddingTop: 12,
              borderTop: '1px solid #e8e8e8',
            }}>
              <Space size={16}>
                <Tooltip title="Stars">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#57606a', fontSize: 13 }}>
                    <StarOutlined style={{ color: '#e3b341' }} />
                    {formatNumber(repo.starsCount || 0)}
                  </span>
                </Tooltip>
                <Tooltip title="Forks">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#57606a', fontSize: 13 }}>
                    <ForkOutlined />
                    {formatNumber(repo.forksCount || 0)}
                  </span>
                </Tooltip>
              </Space>
              <div style={{ flex: 1 }} />
              <Button
                size="small"
                type={isFavorited ? 'primary' : 'default'}
                icon={isFavorited ? <CheckCircleOutlined /> : <StarOutlined />}
                onClick={(e) => {
                  e.preventDefault();
                  handleToggleSubscription(repo.id);
                }}
                style={{
                  borderRadius: 8,
                  fontSize: 12,
                  height: 32,
                  background: isFavorited ? '#238636' : undefined,
                  borderColor: isFavorited ? '#238636' : undefined,
                }}
              >
                {isFavorited ? '已订阅' : '订阅'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderCardView = () => (
    <Row gutter={[20, 20]}>
      {repos.map((repo) => (
        <Col xs={24} sm={12} lg={8} xl={6} key={repo.id}>
          <RepoCard repo={repo} />
        </Col>
      ))}
    </Row>
  );

  const renderListView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {repos.map((repo) => {
        const isFavorited = subscriptionIds.has(repo.id);
        return (
          <Card
            key={repo.id}
            hoverable
            style={{
              borderRadius: 12,
              border: '1px solid #e8e8e8',
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <GithubOutlined style={{ fontSize: 20, color: '#24292f' }} />
                  <a
                    href={repo.htmlUrl || `https://github.com/${repo.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <span style={{ fontSize: 17, fontWeight: 600, color: '#24292f' }}>
                      {repo.fullName || repo.name}
                    </span>
                  </a>
                  {repo.language && (
                    <Tag
                      style={{
                        background: `${getLanguageColor(repo.language)}15`,
                        color: getLanguageColor(repo.language),
                        border: `1px solid ${getLanguageColor(repo.language)}30`,
                        borderRadius: 6,
                        fontSize: 12,
                        padding: '2px 10px',
                        fontWeight: 500,
                      }}
                    >
                      {repo.language}
                    </Tag>
                  )}
                </div>

                <div style={{
                  fontSize: 14,
                  color: '#57606a',
                  lineHeight: 1.6,
                  marginBottom: 12,
                }}>
                  {repo.description || '暂无描述'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <Space size={16}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#57606a', fontSize: 13 }}>
                      <StarOutlined style={{ color: '#e3b341' }} />
                      {formatNumber(repo.starsCount || 0)} Stars
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#57606a', fontSize: 13 }}>
                      <ForkOutlined />
                      {formatNumber(repo.forksCount || 0)} Forks
                    </span>
                    {repo.updatedDate && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8b949e', fontSize: 12 }}>
                        <ClockCircleOutlined />
                        更新于 {dayjs(repo.updatedDate).fromNow()}
                      </span>
                    )}
                  </Space>
                  {repo.topics && Array.isArray(repo.topics) && repo.topics.slice(0, 4).map((topic: string) => (
                    <Tag
                      key={topic}
                      style={{
                        background: '#ddf4ff',
                        color: '#0969da',
                        border: 'none',
                        borderRadius: 16,
                        fontSize: 11,
                        padding: '2px 10px',
                      }}
                    >
                      {topic}
                    </Tag>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  type={isFavorited ? 'primary' : 'default'}
                  icon={isFavorited ? <CheckCircleOutlined /> : <StarOutlined />}
                  onClick={() => handleToggleSubscription(repo.id)}
                  style={{
                    borderRadius: 8,
                    height: 36,
                    background: isFavorited ? '#238636' : undefined,
                    borderColor: isFavorited ? '#238636' : undefined,
                  }}
                >
                  {isFavorited ? '已订阅' : '订阅'}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const renderSkeleton = () => {
    if (viewMode === 'card') {
      return (
        <Row gutter={[20, 20]}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={n}>
              <Card style={{ height: 220, borderRadius: 16 }}>
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))}
        </Row>
      );
    } else {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Card key={n} style={{ borderRadius: 12 }}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          ))}
        </div>
      );
    }
  };

  return (
    <div style={{ background: '#f6f8fa', minHeight: '100%', padding: '24px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #24292f 0%, #424a53 100%)',
            borderRadius: 16,
            padding: '32px 32px 24px',
            marginBottom: 24,
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <GithubOutlined style={{ fontSize: 36 }} />
                <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, color: '#fff' }}>
                  GitHub 项目
                </h1>
              </div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginLeft: 48 }}>
                发现具身智能、机器人领域的优质开源项目
              </div>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => {
                if (!user) {
                  message.warning('请先登录');
                  return;
                }
                setSubmitModalOpen(true);
              }}
              style={{
                background: '#238636',
                borderColor: '#238636',
                borderRadius: 10,
                height: 44,
                fontWeight: 500,
              }}
            >
              提交项目
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Input.Search
              placeholder="搜索项目名称、描述..."
              style={{ width: 400 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
              size="large"
            />
            <Select
              value={sort}
              onChange={setSort}
              style={{ width: 140 }}
              size="large"
            >
              <Option value="stars">
                <StarOutlined style={{ marginRight: 8 }} />
                Star 数
              </Option>
              <Option value="hot">
                <FireOutlined style={{ marginRight: 8 }} />
                最热
              </Option>
              <Option value="latest">
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                最近更新
              </Option>
            </Select>
            <Select
              value={language}
              onChange={(value) => setLanguage(value)}
              style={{ width: 140 }}
              allowClear
              placeholder="语言"
              size="large"
            >
              <Option value="Python">Python</Option>
              <Option value="C++">C++</Option>
              <Option value="JavaScript">JavaScript</Option>
              <Option value="TypeScript">TypeScript</Option>
              <Option value="Jupyter Notebook">Jupyter Notebook</Option>
              <Option value="Java">Java</Option>
              <Option value="Go">Go</Option>
              <Option value="Rust">Rust</Option>
              <Option value="Lua">Lua</Option>
            </Select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 15, color: '#57606a' }}>
            共 <span style={{ fontWeight: 600, color: '#24292f' }}>{total}</span> 个项目
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              type={viewMode === 'card' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('card')}
              style={{ borderRadius: 8 }}
            >
              卡片
            </Button>
            <Button
              type={viewMode === 'list' ? 'primary' : 'default'}
              icon={<BarsOutlined />}
              onClick={() => setViewMode('list')}
              style={{ borderRadius: 8 }}
            >
              列表
            </Button>
          </div>
        </div>

        <div style={{ minHeight: 400 }}>
          {loading && repos.length === 0 ? (
            renderSkeleton()
          ) : (
            <>
              {viewMode === 'card' ? renderCardView() : renderListView()}

              {repos.length === 0 && !loading && (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<span style={{ color: '#8b949e', fontSize: 15 }}>暂无 GitHub 项目</span>}
                  style={{ padding: '80px 0' }}
                />
              )}

              {repos.length > 0 && (
                <div style={{ marginTop: 32, textAlign: 'center' }}>
                  <Pagination
                    current={page}
                    pageSize={pageSize}
                    total={total}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                    pageSizeOptions={['12', '20', '30', '50']}
                    onChange={(newPage, newPageSize) => {
                      if (newPageSize && newPageSize !== pageSize) {
                        setPageSize(newPageSize);
                        setPage(1);
                        loadRepos(1);
                      } else {
                        setPage(newPage);
                        loadRepos(newPage);
                      }
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GithubOutlined style={{ fontSize: 20 }} />
            <span>提交 GitHub 项目</span>
          </div>
        }
        open={submitModalOpen}
        onCancel={() => {
          setSubmitModalOpen(false);
          setGithubUrl('');
          setRepoPreview(null);
          submitForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Input
              placeholder="粘贴GitHub仓库URL，如：https://github.com/owner/repo"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              size="large"
              prefix={<LinkOutlined style={{ color: '#8b949e' }} />}
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              onClick={fetchGitHubRepoInfo}
              loading={fetchingRepo}
              size="large"
              style={{ borderRadius: 8 }}
            >
              解析
            </Button>
          </div>
        </div>

        {repoPreview && (
          <Form
            form={submitForm}
            layout="vertical"
            onFinish={handleSubmitRepo}
          >
            <Card
              style={{
                marginBottom: 20,
                borderRadius: 12,
                background: '#f6f8fa',
                border: '1px solid #d0d7de',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <GithubOutlined style={{ fontSize: 24, color: '#24292f', marginTop: 4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#24292f', marginBottom: 4 }}>
                    {repoPreview.fullName}
                  </div>
                  <div style={{ fontSize: 14, color: '#57606a', marginBottom: 12 }}>
                    {repoPreview.description || '暂无描述'}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {repoPreview.language && (
                      <Tag style={{
                        background: `${getLanguageColor(repoPreview.language)}15`,
                        color: getLanguageColor(repoPreview.language),
                        border: `1px solid ${getLanguageColor(repoPreview.language)}30`,
                        borderRadius: 6,
                      }}>
                        {repoPreview.language}
                      </Tag>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#57606a', fontSize: 13 }}>
                      <StarOutlined style={{ color: '#e3b341' }} />
                      {formatNumber(repoPreview.starsCount || 0)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#57606a', fontSize: 13 }}>
                      <ForkOutlined />
                      {formatNumber(repoPreview.forksCount || 0)}
                    </span>
                  </div>
                  {repoPreview.topics && repoPreview.topics.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {repoPreview.topics.slice(0, 5).map((topic: string) => (
                        <Tag
                          key={topic}
                          style={{
                            background: '#ddf4ff',
                            color: '#0969da',
                            border: 'none',
                            borderRadius: 16,
                            fontSize: 11,
                          }}
                        >
                          {topic}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Form.Item
              name="description"
              label="补充描述（可选）"
            >
              <TextArea
                placeholder="可以补充项目描述或推荐理由..."
                rows={3}
                showCount
                maxLength={500}
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button onClick={() => {
                setSubmitModalOpen(false);
                setGithubUrl('');
                setRepoPreview(null);
                submitForm.resetFields();
              }}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{
                  background: '#238636',
                  borderColor: '#238636',
                }}
              >
                提交项目
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
}
