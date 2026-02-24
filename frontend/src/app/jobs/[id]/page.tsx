/**
 * 岗位详情页
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Layout, Card, Space, Tag, Spin, Button, Divider, App } from 'antd';
import { EyeOutlined, HeartOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { jobApi } from '@/lib/api/job';
import { Job } from '@/lib/api/types';
import { useAuthStore } from '@/store/authStore';
import { useFavorite } from '@/hooks/useFavorite';
import { DynamicComponents } from '@/lib/dynamicComponents';
import { communityApi } from '@/lib/api/community';
import styles from './page.module.css';

const { Content } = Layout;

export default function JobDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useAuthStore();
  const { message } = App.useApp();

  const { isFavorited, setIsFavorited } = useFavorite('job', id || '');

  const loadJob = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await jobApi.getJob(id);
      if (data) {
        setJob(data);
      } else {
        setJob(null);
      }
    } catch (error: any) {
      console.error('Load job error:', error);
      setJob(null);
      const errorMessage = error?.message || error?.response?.data?.message || '加载失败';
      if (error?.status !== 404) {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [id, message]);

  useEffect(() => {
    if (typeof window !== 'undefined' && id) {
      loadJob();
    }
  }, [id, loadJob]);

  const handleShare = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    setShareOpen(true);
  };

  if (loading) {
    return (
      <div style={{ padding: 100, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!job) {
    return (
      <div style={{ padding: 100, textAlign: 'center', color: '#999' }}>
        岗位不存在
      </div>
    );
  }

  const handleFavorite = () => {
    if (!user) {
      message.warning('请先登录');
      return;
    }
    const action = isFavorited
      ? communityApi.deleteFavorite('job', job.id)
      : communityApi.createFavorite({ contentType: 'job', contentId: job.id });
    action
      .then(() => {
        message.success(isFavorited ? '已取消收藏' : '收藏成功!');
        setIsFavorited(!isFavorited);
      })
      .catch((error: any) => {
        message.error(error.message || (isFavorited ? '取消收藏失败' : '收藏失败'));
      });
  };

  return (
    <div className={styles.pageWrapper}>
      <Content style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card className={styles.detailCard}>
          <h1 className={styles.pageTitle}>{job.title}</h1>
          <Space wrap style={{ marginBottom: 16 }}>
            <span style={{ color: '#666' }}>{job.company}</span>
            {job.location && <Tag>{job.location}</Tag>}
            {job.status === 'open' ? <Tag color="green">招聘中</Tag> : <Tag color="red">已关闭</Tag>}
          </Space>

          <div className={styles.statsRow}>
            <Space size="large">
              <span><EyeOutlined /> {job.viewCount} 浏览</span>
              <span><HeartOutlined /> {job.favoriteCount} 收藏</span>
              <span>投递 {job.applyCount}</span>
            </Space>
          </div>

          <Space size="middle" className={styles.actionBar}>
            <Button 
              type="primary"
              href={(job as { applyUrl?: string; apply_url?: string }).applyUrl ?? ((job as { apply_url?: string }).apply_url || 'https://github.com/StarCycle/Awesome-Embodied-AI-Job')} 
              target="_blank"
              rel="noopener noreferrer"
            >
              投递简历
            </Button>
            <Button type={isFavorited ? 'primary' : 'default'} onClick={handleFavorite}>
              {isFavorited ? '已收藏' : '收藏'}
            </Button>
            <Button icon={<ShareAltOutlined />} onClick={handleShare}>
              分享到市集
            </Button>
          </Space>

          <Divider />

          <div style={{ marginBottom: 16 }}>
            <h3>薪资</h3>
            <div style={{ color: '#333' }}>
              {job.salaryMin && job.salaryMax ? `${job.salaryMin}K-${job.salaryMax}K` : '薪资面议'}
            </div>
          </div>

          {job.experience && (
            <div style={{ marginBottom: 16 }}>
              <h3>经验要求</h3>
              <div style={{ color: '#333' }}>{job.experience}</div>
            </div>
          )}

          {job.education && (
            <div style={{ marginBottom: 16 }}>
              <h3>学历要求</h3>
              <div style={{ color: '#333' }}>{job.education}</div>
            </div>
          )}

          {job.description && (
            <div style={{ marginBottom: 16 }}>
              <h3>岗位描述</h3>
              <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{job.description}</div>
            </div>
          )}

          {job.requirements && (
            <div style={{ marginBottom: 16 }}>
              <h3>任职要求</h3>
              <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{job.requirements}</div>
            </div>
          )}

          {job.benefits && (
            <div style={{ marginBottom: 16 }}>
              <h3>福利</h3>
              <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{job.benefits}</div>
            </div>
          )}

          {job.tags && Array.isArray(job.tags) && job.tags.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {job.tags.map((tag) => (
                <Tag key={tag} color="blue">{tag}</Tag>
              ))}
            </div>
          )}
        </Card>
      </Content>

      <DynamicComponents.ShareModal
        open={shareOpen}
        title={job.title}
        url={typeof window !== 'undefined' ? `${window.location.origin}/jobs/${job.id}` : ''}
        onPublish={async (content) => {
          await communityApi.createPost({
            contentType: 'job',
            contentId: job.id,
            title: `分享：${job.title}`,
            content,
          });
        }}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
