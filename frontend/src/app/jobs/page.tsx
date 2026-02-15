'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Space,
  Select,
  Input,
  Tabs,
  Modal,
  Form,
  Upload,
  Avatar,
  Typography,
  theme,
  Row,
  Col,
  Pagination,
  Skeleton,
  App,
  Tooltip,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  StarOutlined,
  StarFilled,
  TeamOutlined,
  UserOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  BarsOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { jobApi } from '@/lib/api/job';
import { Job } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import { parseTags } from '@/lib/utils/jsonParse';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import PageContainer from '@/components/PageContainer';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;

type TabType = 'recruitment' | 'jobseeking';
type ViewType = 'card' | 'list';

export default function JobsPage() {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobSeekingPosts, setJobSeekingPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('recruitment');
  const [viewType, setViewType] = useState<ViewType>('card');
  const [sort, setSort] = useState<'latest' | 'hot' | 'salary'>('latest');
  const [location, setLocation] = useState<string | undefined>(undefined);
  const [keyword, setKeyword] = useState('');
  const { user } = useAuthStore();
  const { message } = App.useApp();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [publishType, setPublishType] = useState<'recruitment' | 'jobseeking'>('recruitment');
  const [publishForm] = Form.useForm();
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myPostsModalVisible, setMyPostsModalVisible] = useState(false);

  useEffect(() => {
    if (activeTab === 'recruitment') {
      loadJobs(1);
    } else {
      loadJobSeekingPosts(1);
    }
  }, [activeTab, sort, location]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavoriteIds(new Set());
    }
  }, [user]);

  const loadJobs = async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await jobApi.getJobs({
        page: pageNum,
        size: pageSize,
        sort,
        location,
        keyword: keyword || undefined,
      });

      if (!data || !data.items || !Array.isArray(data.items)) {
        setJobs([]);
        setTotal(0);
        return;
      }

      setJobs(data.items);
      setPage(pageNum);
      setTotal(data.pagination?.total || 0);
    } catch (error: any) {
      console.error('Load jobs error:', error);
      setJobs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadJobSeekingPosts = async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await jobApi.getJobSeekingPosts({
        page: pageNum,
        size: pageSize,
        sort,
        location,
        keyword: keyword || undefined,
      });

      if (!data || !data.items || !Array.isArray(data.items)) {
        setJobSeekingPosts([]);
        setTotal(0);
        return;
      }

      setJobSeekingPosts(data.items);
      setPage(pageNum);
      setTotal(data.pagination?.total || 0);
    } catch (error: any) {
      console.error('Load job seeking posts error:', error);
      setJobSeekingPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    if (activeTab === 'recruitment') {
      loadJobs(1);
    } else {
      loadJobSeekingPosts(1);
    }
  };

  const loadFavorites = async () => {
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 200, contentType: 'job' });
      const ids = new Set((data.items || []).map((fav: any) => fav.contentId));
      setFavoriteIds(ids);
    } catch (error: any) {
      console.error('Load favorites error:', error);
    }
  };

  const handleToggleFavorite = (jobId: string) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const already = favoriteIds.has(jobId);
    const action = already
      ? communityApi.deleteFavorite('job', jobId)
      : communityApi.createFavorite({ contentType: 'job', contentId: jobId });
    action
      .then(() => {
        message.success(already ? '已取消收藏' : '收藏成功!');
        loadFavorites();
      })
      .catch((error: any) => {
        message.error(error.message || (already ? '取消收藏失败' : '收藏失败'));
      });
  };

  const handlePublish = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    setPublishType(activeTab === 'recruitment' ? 'recruitment' : 'jobseeking');
    setPublishModalVisible(true);
  };

  const handlePublishSubmit = async (values: any) => {
    try {
      if (publishType === 'recruitment') {
        await jobApi.createJob(values);
        message.success('发布成功！');
      } else {
        await jobApi.createJobSeekingPost(values);
        message.success('发布成功！');
      }
      setPublishModalVisible(false);
      publishForm.resetFields();

      if (activeTab === 'recruitment') {
        loadJobs(1);
      } else {
        loadJobSeekingPosts(1);
      }
    } catch (error: any) {
      message.error(error.message || '发布失败');
    }
  };

  const handleLoadMyPosts = async () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    try {
      const data = await jobApi.getMyPosts();
      setMyPosts(data.items);
      setMyPostsModalVisible(true);
    } catch (error: any) {
      message.error(error.message || '加载失败');
    }
  };

  const handleDeletePost = async (postId: string, type: 'recruitment' | 'jobseeking') => {
    try {
      if (type === 'recruitment') {
        await jobApi.deleteJob(postId);
      } else {
        await jobApi.deleteJobSeekingPost(postId);
      }
      message.success('删除成功');

      setMyPosts(myPosts.filter((post: any) => post.id !== postId));

      if (activeTab === 'recruitment') {
        loadJobs(1);
      } else {
        loadJobSeekingPosts(1);
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    beforeUpload: (file: any) => {
      const isPDF = file.type === 'application/pdf';
      if (!isPDF) {
        message.error('只能上传PDF格式的简历');
      }
      return isPDF || Upload.LIST_IGNORE;
    },
    onChange: (info: any) => {
      if (info.file.status === 'done') {
        publishForm.setFieldsValue({ resume: info.file });
      }
    },
  };

  const renderJobCard = (job: Job) => (
    <div
      key={job.id}
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 4,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <Tooltip title={job.title} placement="topLeft">
            <a
              href={job.applyUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', flex: 1, marginRight: 12 }}
            >
              <Text
                strong
                style={{
                  fontSize: 18,
                  color: token.colorText,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.4,
                }}
              >
                {job.title}
              </Text>
            </a>
          </Tooltip>
          <Button
            type={favoriteIds.has(job.id) ? 'primary' : 'default'}
            size="small"
            onClick={() => handleToggleFavorite(job.id)}
            icon={favoriteIds.has(job.id) ? <StarFilled /> : <StarOutlined />}
            style={{
              borderRadius: 4,
              height: 36,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {favoriteIds.has(job.id) ? '已收藏' : '收藏'}
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <Space size={4} style={{ color: token.colorTextSecondary, fontSize: 15 }}>
            <TeamOutlined style={{ fontSize: 14 }} />
            <span>{job.company}</span>
          </Space>
          <Space size={4} style={{ color: token.colorTextSecondary, fontSize: 15 }}>
            <EnvironmentOutlined style={{ fontSize: 14 }} />
            <span>{job.location || '地点未知'}</span>
          </Space>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {job.salaryMin && job.salaryMax && (
            <span
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: token.colorPrimary,
                padding: '4px 12px',
                border: `1px solid ${token.colorPrimary}`,
                borderRadius: 2,
              }}
            >
              {job.salaryMin}-{job.salaryMax}K
            </span>
          )}
          {job.createdAt && (
            <Space size={4} style={{ color: token.colorTextTertiary, fontSize: 14 }}>
              <ClockCircleOutlined style={{ fontSize: 13 }} />
              <span>{dayjs(job.createdAt).fromNow()}</span>
            </Space>
          )}
        </div>

        {job.tags && (
          <div style={{ marginBottom: 16 }}>
            {parseTags(job.tags, 4).map((tag: string) => (
              <span
                key={tag}
                style={{
                  display: 'inline-block',
                  fontSize: 13,
                  padding: '4px 10px',
                  marginRight: 6,
                  marginBottom: 6,
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: 2,
                  color: token.colorTextSecondary,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {job.description && (
          <Text
            style={{
              fontSize: 14,
              color: token.colorTextTertiary,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.6,
            }}
          >
            {job.description}
          </Text>
        )}
      </div>
    </div>
  );

  const renderJobListItem = (job: Job) => (
    <div
      key={job.id}
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 4,
        padding: '20px 24px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <Tooltip title={job.title} placement="topLeft">
              <a
                href={job.applyUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <Text
                  strong
                  style={{
                    fontSize: 18,
                    color: token.colorText,
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {job.title}
                </Text>
              </a>
            </Tooltip>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              {job.salaryMin && job.salaryMax && (
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: token.colorPrimary,
                    padding: '4px 12px',
                    border: `1px solid ${token.colorPrimary}`,
                    borderRadius: 2,
                  }}
                >
                  {job.salaryMin}-{job.salaryMax}K
                </span>
              )}
              <Button
                type={favoriteIds.has(job.id) ? 'primary' : 'default'}
                size="small"
                onClick={() => handleToggleFavorite(job.id)}
                icon={favoriteIds.has(job.id) ? <StarFilled /> : <StarOutlined />}
                style={{ borderRadius: 4, height: 36, fontSize: 14 }}
              >
                {favoriteIds.has(job.id) ? '已收藏' : '收藏'}
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <Space size={4} style={{ color: token.colorTextSecondary, fontSize: 15 }}>
              <TeamOutlined style={{ fontSize: 14 }} />
              <span>{job.company}</span>
            </Space>
            <Space size={4} style={{ color: token.colorTextSecondary, fontSize: 15 }}>
              <EnvironmentOutlined style={{ fontSize: 14 }} />
              <span>{job.location || '地点未知'}</span>
            </Space>
            {job.createdAt && (
              <Space size={4} style={{ color: token.colorTextTertiary, fontSize: 14 }}>
                <ClockCircleOutlined style={{ fontSize: 13 }} />
                <span>{dayjs(job.createdAt).fromNow()}</span>
              </Space>
            )}
            {job.tags && parseTags(job.tags, 4).map((tag: string) => (
              <span
                key={tag}
                style={{
                  fontSize: 13,
                  padding: '3px 8px',
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: 2,
                  color: token.colorTextSecondary,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderJobSeekingCard = (post: any) => (
    <div
      key={post.id}
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 4,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Avatar
            size={48}
            src={post.avatarUrl}
            icon={<UserOutlined />}
            style={{ marginRight: 12, background: token.colorPrimary }}
          />
          <div>
            <Text strong style={{ fontSize: 17, color: token.colorText }}>
              {post.name || '求职者'}
            </Text>
            <br />
            <Text style={{ fontSize: 15, color: token.colorTextSecondary }}>
              {post.targetPosition || '期望职位'}
            </Text>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {post.expectedLocation && (
            <Space size={4} style={{ color: token.colorTextSecondary, fontSize: 15 }}>
              <EnvironmentOutlined style={{ fontSize: 14 }} />
              <span>{post.expectedLocation}</span>
            </Space>
          )}
          {post.expectedSalary && (
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: token.colorPrimary,
                padding: '3px 10px',
                border: `1px solid ${token.colorPrimary}`,
                borderRadius: 2,
              }}
            >
              {post.expectedSalary}
            </span>
          )}
        </div>

        {post.skills && (
          <div style={{ marginBottom: 16 }}>
            {post.skills.split(',').slice(0, 4).map((skill: string) => (
              <span
                key={skill}
                style={{
                  display: 'inline-block',
                  fontSize: 13,
                  padding: '4px 10px',
                  marginRight: 6,
                  marginBottom: 6,
                  border: `1px solid ${token.colorBorder}`,
                  borderRadius: 2,
                  color: token.colorTextSecondary,
                }}
              >
                {skill.trim()}
              </span>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {post.introduction && (
          <Text
            style={{
              fontSize: 14,
              color: token.colorTextTertiary,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.6,
            }}
          >
            {post.introduction}
          </Text>
        )}
      </div>
    </div>
  );

  const tabItems = [
    {
      key: 'recruitment',
      label: (
        <span style={{ fontSize: 16, padding: '4px 0' }}>
          招聘信息
        </span>
      ),
      children: (
        <>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              type={viewType === 'card' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewType('card')}
              style={{ borderRadius: 4, height: 40 }}
            />
            <Button
              type={viewType === 'list' ? 'primary' : 'default'}
              icon={<BarsOutlined />}
              onClick={() => setViewType('list')}
              style={{ borderRadius: 4, height: 40 }}
            />
          </div>

          {loading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : jobs.length > 0 ? (
            viewType === 'card' ? (
              <Row gutter={[20, 20]}>
                {jobs.map((job) => (
                  <Col key={job.id} xs={24} sm={12} lg={8} xl={6}>
                    {renderJobCard(job)}
                  </Col>
                ))}
              </Row>
            ) : (
              <div>{jobs.map((job) => renderJobListItem(job))}</div>
            )
          ) : (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: token.colorTextTertiary,
                fontSize: 16,
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 4,
              }}
            >
              {keyword ? '暂无匹配结果' : '暂无招聘信息'}
            </div>
          )}

          {jobs.length > 0 && (
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
                    loadJobs(1);
                  } else {
                    setPage(newPage);
                    loadJobs(newPage);
                  }
                }}
              />
            </div>
          )}
        </>
      ),
    },
    {
      key: 'jobseeking',
      label: (
        <span style={{ fontSize: 16, padding: '4px 0' }}>
          求职信息
        </span>
      ),
      children: (
        <>
          {loading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : jobSeekingPosts.length > 0 ? (
            <Row gutter={[20, 20]}>
              {jobSeekingPosts.map((post) => (
                <Col key={post.id} xs={24} sm={12} lg={8} xl={6}>
                  {renderJobSeekingCard(post)}
                </Col>
              ))}
            </Row>
          ) : (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: token.colorTextTertiary,
                fontSize: 16,
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 4,
              }}
            >
              {keyword ? '暂无匹配结果' : '暂无求职信息'}
            </div>
          )}

          {jobSeekingPosts.length > 0 && (
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
                    loadJobSeekingPosts(1);
                  } else {
                    setPage(newPage);
                    loadJobSeekingPosts(newPage);
                  }
                }}
              />
            </div>
          )}
        </>
      ),
    },
  ];

  return (
    <PageContainer>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={2} style={{ margin: 0, marginBottom: 4 }}>
              招聘求职
            </Title>
            <Text style={{ fontSize: 15, color: token.colorTextSecondary }}>
              共 {total} 条信息
            </Text>
          </div>
          <Space size={12}>
            <Button
              onClick={handleLoadMyPosts}
              style={{ borderRadius: 4, height: 44, fontSize: 16 }}
            >
              我的发布
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handlePublish}
              style={{ borderRadius: 4, height: 44, fontSize: 16 }}
            >
              发布信息
            </Button>
          </Space>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            alignItems: 'center',
            padding: 20,
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: 4,
          }}
        >
          <Input.Search
            placeholder="搜索职位、公司..."
            style={{ width: 320, borderRadius: 4 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
            size="large"
          />
          <Select
            value={location}
            onChange={setLocation}
            style={{ width: 140, borderRadius: 4 }}
            allowClear
            placeholder="地点"
            size="large"
          >
            <Option value="北京">北京</Option>
            <Option value="上海">上海</Option>
            <Option value="深圳">深圳</Option>
            <Option value="杭州">杭州</Option>
            <Option value="广州">广州</Option>
            <Option value="成都">成都</Option>
            <Option value="远程">远程</Option>
          </Select>
          <Select
            value={sort}
            onChange={setSort}
            style={{ width: 140, borderRadius: 4 }}
            size="large"
          >
            <Option value="latest">最新发布</Option>
            <Option value="hot">最热</Option>
            <Option value="salary">薪资最高</Option>
          </Select>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabType)}
        items={tabItems}
        size="large"
        style={{ marginBottom: 24 }}
      />

      <Modal
        title={publishType === 'recruitment' ? '发布招聘信息' : '发布求职信息'}
        open={publishModalVisible}
        onCancel={() => {
          setPublishModalVisible(false);
          publishForm.resetFields();
        }}
        onOk={() => publishForm.submit()}
        width={600}
        styles={{ body: { padding: 24 } }}
      >
        <Form form={publishForm} layout="vertical" onFinish={handlePublishSubmit}>
          {publishType === 'recruitment' ? (
            <>
              <Form.Item name="title" label="职位名称" rules={[{ required: true, message: '请输入职位名称' }]}>
                <Input placeholder="如：高级前端工程师" style={{ borderRadius: 4, height: 44 }} />
              </Form.Item>
              <Form.Item name="company" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
                <Input placeholder="请输入公司名称" style={{ borderRadius: 4, height: 44 }} />
              </Form.Item>
              <Form.Item name="location" label="工作地点">
                <Input placeholder="如：北京" style={{ borderRadius: 4, height: 44 }} />
              </Form.Item>
              <Form.Item label="薪资范围（K）">
                <Space>
                  <Form.Item name="salaryMin" noStyle>
                    <Input type="number" min={0} placeholder="最低" style={{ borderRadius: 4, width: 100, height: 44 }} />
                  </Form.Item>
                  <span>-</span>
                  <Form.Item name="salaryMax" noStyle>
                    <Input type="number" min={0} placeholder="最高" style={{ borderRadius: 4, width: 100, height: 44 }} />
                  </Form.Item>
                </Space>
              </Form.Item>
              <Form.Item name="description" label="职位描述">
                <TextArea rows={4} placeholder="请输入职位描述" style={{ borderRadius: 4 }} />
              </Form.Item>
              <Form.Item name="tags" label="技能标签">
                <Input placeholder="多个标签用逗号分隔，如：React,TypeScript,Node.js" style={{ borderRadius: 4, height: 44 }} />
              </Form.Item>
              <Form.Item name="applyUrl" label="申请链接">
                <Input placeholder="请输入申请链接" style={{ borderRadius: 4, height: 44 }} />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" style={{ borderRadius: 4, height: 44 }} />
              </Form.Item>
              <Form.Item name="targetPosition" label="期望职位" rules={[{ required: true, message: '请输入期望职位' }]}>
                <Input placeholder="如：前端工程师" style={{ borderRadius: 4, height: 44 }} />
              </Form.Item>
              <Form.Item name="expectedLocation" label="期望工作地点">
                <Input placeholder="如：北京" style={{ borderRadius: 4, height: 44 }} />
              </Form.Item>
              <Form.Item name="expectedSalary" label="期望薪资">
                <Input placeholder="如：20-30K" style={{ borderRadius: 4, height: 44 }} />
              </Form.Item>
              <Form.Item name="skills" label="技能标签">
                <Input placeholder="多个技能用逗号分隔，如：React,TypeScript,Node.js" style={{ borderRadius: 4, height: 44 }} />
              </Form.Item>
              <Form.Item name="introduction" label="自我介绍">
                <TextArea rows={4} placeholder="请输入自我介绍" style={{ borderRadius: 4 }} />
              </Form.Item>
              <Form.Item name="resume" label="简历">
                <Upload.Dragger {...uploadProps} style={{ borderRadius: 4 }}>
                  <p style={{ padding: 20 }}>点击或拖拽上传简历（PDF格式）</p>
                </Upload.Dragger>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      <Modal
        title="我的发布"
        open={myPostsModalVisible}
        onCancel={() => setMyPostsModalVisible(false)}
        footer={null}
        width={700}
        styles={{ body: { padding: 24 } }}
      >
        {myPosts.length > 0 ? (
          myPosts.map((post: any) => (
            <div
              key={post.id}
              style={{
                padding: '16px 20px',
                marginBottom: 12,
                background: token.colorBgLayout,
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 4,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ fontSize: 16 }}>{post.title || post.targetPosition}</Text>
                  <br />
                  <Text style={{ fontSize: 14, color: token.colorTextSecondary }}>
                    {dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}
                  </Text>
                </div>
                <Button
                  danger
                  size="small"
                  onClick={() => handleDeletePost(post.id, post.type || 'recruitment')}
                  style={{ borderRadius: 4, height: 36 }}
                >
                  删除
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: token.colorTextTertiary,
              fontSize: 16,
            }}
          >
            暂无发布记录
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
