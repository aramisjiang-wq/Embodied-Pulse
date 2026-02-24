'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button, Input, Empty, Skeleton, App, Modal, List, Divider, Switch, Form, Card, Tag, Collapse, Pagination } from 'antd';
import dayjs from 'dayjs';
import { getDateStyle, formatFreshDate } from '@/lib/utils/dateUtils';
import {
  BellOutlined,
  UserOutlined,
  PlusOutlined,
  DeleteOutlined,
  LinkOutlined,
  HeartOutlined,
  HeartFilled,
  RobotOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  RightOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { huggingfaceApi, HuggingFaceModelPreview } from '@/lib/api/huggingface';
import { HuggingFaceModel } from '@/lib/api/types';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { communityApi } from '@/lib/api/community';
import { contentSubscriptionApi } from '@/lib/api/content-subscription';
import { clearCache } from '@/lib/api/cached-client';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';

type SortType = 'latest' | 'hot' | 'downloads' | 'likes';

const SORT_OPTIONS: { value: SortType; label: string }[] = [
  { value: 'latest', label: '最新更新' },
  { value: 'hot', label: '最热门' },
  { value: 'downloads', label: '下载量' },
  { value: 'likes', label: '点赞数' },
];

const CONTENT_TYPES = [
  { id: 'all', label: '全部', value: undefined as string | undefined },
  { id: 'model', label: '模型', value: 'model' },
  { id: 'dataset', label: '数据集', value: 'dataset' },
  { id: 'space', label: '空间', value: 'space' },
];

const RESOURCE_CATEGORIES = [
  {
    id: '1.1 OpenVLA 系列',
    name: 'OpenVLA 系列',
    icon: '🤖',
    type: 'model',
    description: 'OpenVLA 视觉-语言-动作模型',
  },
  {
    id: '1.5 其他 VLA 模型',
    name: '其他 VLA 模型',
    icon: '🦾',
    type: 'model',
    description: '其他视觉-语言-动作模型',
  },
  {
    id: '2.1 GR00T 基础模型',
    name: 'NVIDIA GR00T 系列',
    icon: '🟢',
    type: 'model',
    description: 'NVIDIA 人形机器人基础模型',
  },
  {
    id: '3.1 ACT (Action Chunking Transformer) 模型',
    name: 'ACT 模型',
    icon: '🎯',
    type: 'model',
    description: 'Action Chunking Transformer 模型',
  },
  {
    id: '3.2 Diffusion Policy 模型',
    name: 'Diffusion Policy 模型',
    icon: '🌊',
    type: 'model',
    description: '扩散策略模型',
  },
  {
    id: '3.3 VQ-BeT 模型',
    name: 'VQ-BeT 模型',
    icon: '🎲',
    type: 'model',
    description: 'VQ-BeT 模型',
  },
  {
    id: '7.1 单目深度估计',
    name: '深度估计模型',
    icon: '📏',
    type: 'model',
    description: '单目深度估计模型',
  },
  {
    id: '8.1 自监督视觉模型',
    name: '自监督视觉模型',
    icon: '👁️',
    type: 'model',
    description: '自监督视觉基础模型',
  },
  {
    id: '8.2 CLIP 系列',
    name: 'CLIP 系列',
    icon: '🔗',
    type: 'model',
    description: 'CLIP 视觉-语言模型',
  },
  {
    id: '8.3 视觉 Transformer',
    name: '视觉 Transformer',
    icon: '🖼️',
    type: 'model',
    description: 'Vision Transformer 模型',
  },
  {
    id: '8.4 MAE 系列',
    name: 'MAE 系列',
    icon: '🎭',
    type: 'model',
    description: 'Masked Autoencoder 模型',
  },
  {
    id: '9.1 SAM 系列',
    name: 'SAM 分割模型',
    icon: '✂️',
    type: 'model',
    description: 'Segment Anything Model 系列',
  },
  {
    id: '10.1 通用目标检测',
    name: '目标检测模型',
    icon: '🎯',
    type: 'model',
    description: '通用目标检测模型',
  },
  {
    id: '11.1 人体姿态估计',
    name: '姿态估计模型',
    icon: '🧍',
    type: 'model',
    description: '人体姿态估计模型',
  },
  {
    id: '15.2 扩散策略模型扩展',
    name: '扩散策略模型扩展',
    icon: '🌊',
    type: 'model',
    description: '扩散策略模型扩展',
  },
  {
    id: '15.3 多模态大语言模型',
    name: '多模态大语言模型',
    icon: '🧠',
    type: 'model',
    description: '多模态大语言模型',
  },
  {
    id: '15.4 端到端机器人模型',
    name: '端到端机器人模型',
    icon: '🤖',
    type: 'model',
    description: '端到端机器人模型',
  },
  {
    id: '15.5 触觉感知与力控模型',
    name: '触觉感知与力控模型',
    icon: '✋',
    type: 'model',
    description: '触觉感知与力控模型',
  },
  {
    id: '15.6 四足与足式机器人模型',
    name: '四足与足式机器人模型',
    icon: '🐕',
    type: 'model',
    description: '四足与足式机器人模型',
  },
  {
    id: '15.7 机械臂与操作模型',
    name: '机械臂与操作模型',
    icon: '🦾',
    type: 'model',
    description: '机械臂与操作模型',
  },
  {
    id: '15.8 人形机器人模型',
    name: '人形机器人模型',
    icon: '🧍',
    type: 'model',
    description: '人形机器人模型',
  },
  {
    id: '15.9 无人机与空中机器人模型',
    name: '无人机与空中机器人模型',
    icon: '🚁',
    type: 'model',
    description: '无人机与空中机器人模型',
  },
  {
    id: '15.10 自动驾驶与车载模型',
    name: '自动驾驶与车载模型',
    icon: '🚗',
    type: 'model',
    description: '自动驾驶与车载模型',
  },
  {
    id: '16.1 Open-X-Embodiment 系列',
    name: 'Open-X-Embodiment 系列',
    icon: '📦',
    type: 'dataset',
    description: 'Open-X-Embodiment 核心数据集',
  },
  {
    id: '16.2 DROID 系列',
    name: 'DROID 系列',
    icon: '🤖',
    type: 'dataset',
    description: 'DROID 机器人数据集',
  },
  {
    id: '16.3 Bridge 系列',
    name: 'Bridge 系列',
    icon: '🌉',
    type: 'dataset',
    description: 'Bridge 数据集系列',
  },
  {
    id: '17.1 通用操作数据集',
    name: '通用操作数据集',
    icon: '🦾',
    type: 'dataset',
    description: '通用机器人操作数据集',
  },
  {
    id: '17.2 操作任务数据集',
    name: '操作任务数据集',
    icon: '🎯',
    type: 'dataset',
    description: '特定操作任务数据集',
  },
  {
    id: '18.1 ALOHA 仿真数据集',
    name: 'ALOHA 仿真数据集',
    icon: '🖥️',
    type: 'dataset',
    description: 'ALOHA 仿真环境数据集',
  },
  {
    id: '18.2 ALOHA 静态数据集',
    name: 'ALOHA 静态数据集',
    icon: '🦾',
    type: 'dataset',
    description: 'ALOHA 静态数据集',
  },
  {
    id: '18.3 ALOHA 移动数据集',
    name: 'ALOHA 移动数据集',
    icon: '🚗',
    type: 'dataset',
    description: 'ALOHA 移动数据集',
  },
  {
    id: '18.4 XArm 数据集',
    name: 'XArm 数据集',
    icon: '🦾',
    type: 'dataset',
    description: 'XArm 机械臂数据集',
  },
  {
    id: '18.5 PushT 数据集',
    name: 'PushT 数据集',
    icon: '👆',
    type: 'dataset',
    description: 'PushT 推动任务数据集',
  },
  {
    id: '18.6 UMI 数据集',
    name: 'UMI 数据集',
    icon: '🤖',
    type: 'dataset',
    description: 'UMI 通用操作数据集',
  },
  {
    id: '18.7 其他 LeRobot 数据集',
    name: '其他 LeRobot 数据集',
    icon: '📁',
    type: 'dataset',
    description: '其他 LeRobot 数据集',
  },
  {
    id: '19.1 官方 ALOHA 数据集',
    name: '官方 ALOHA 数据集',
    icon: '🦾',
    type: 'dataset',
    description: '官方 ALOHA 数据集',
  },
  {
    id: '19.2 Mobile ALOHA 数据集',
    name: 'Mobile ALOHA 数据集',
    icon: '🚗',
    type: 'dataset',
    description: 'Mobile ALOHA 数据集',
  },
  {
    id: '19.3 NVIDIA ALOHA 数据集',
    name: 'NVIDIA ALOHA 数据集',
    icon: '🟢',
    type: 'dataset',
    description: 'NVIDIA ALOHA 数据集',
  },
  {
    id: '19.4 其他 ALOHA 数据集',
    name: '其他 ALOHA 数据集',
    icon: '📁',
    type: 'dataset',
    description: '其他 ALOHA 数据集',
  },
  {
    id: '20.1 核心 LIBERO 数据集',
    name: '核心 LIBERO 数据集',
    icon: '🎯',
    type: 'dataset',
    description: 'LIBERO 核心数据集',
  },
  {
    id: '20.2 LIBERO 任务数据集',
    name: 'LIBERO 任务数据集',
    icon: '📋',
    type: 'dataset',
    description: 'LIBERO 任务数据集',
  },
  {
    id: '20.3 NVIDIA LIBERO 数据集',
    name: 'NVIDIA LIBERO 数据集',
    icon: '🟢',
    type: 'dataset',
    description: 'NVIDIA LIBERO 数据集',
  },
  {
    id: '20.4 LIBERO 处理数据集',
    name: 'LIBERO 处理数据集',
    icon: '🔧',
    type: 'dataset',
    description: 'LIBERO 处理数据集',
  },
  {
    id: '21.1 大规模人形机器人数据集',
    name: '大规模人形机器人数据集',
    icon: '🧍',
    type: 'dataset',
    description: '大规模人形机器人数据集',
  },
  {
    id: '21.2 人形机器人运动数据集',
    name: '人形机器人运动数据集',
    icon: '🏃',
    type: 'dataset',
    description: '人形机器人运动数据集',
  },
  {
    id: '21.3 人形机器人操作数据集',
    name: '人形机器人操作数据集',
    icon: '🦾',
    type: 'dataset',
    description: '人形机器人操作数据集',
  },
  {
    id: '21.4 人形机器人其他数据集',
    name: '人形机器人其他数据集',
    icon: '📁',
    type: 'dataset',
    description: '人形机器人其他数据集',
  },
  {
    id: '22.1 视觉导航数据集',
    name: '视觉导航数据集',
    icon: '🗺️',
    type: 'dataset',
    description: '视觉导航数据集',
  },
  {
    id: '22.2 移动机器人数据集',
    name: '移动机器人数据集',
    icon: '🚗',
    type: 'dataset',
    description: '移动机器人数据集',
  },
  {
    id: '22.3 四足机器人数据集',
    name: '四足机器人数据集',
    icon: '🐕',
    type: 'dataset',
    description: '四足机器人数据集',
  },
  {
    id: '23.1 RLBench 数据集',
    name: 'RLBench 数据集',
    icon: '🎮',
    type: 'dataset',
    description: 'RLBench 仿真环境数据集',
  },
  {
    id: '23.2 MuJoCo 数据集',
    name: 'MuJoCo 数据集',
    icon: '🎮',
    type: 'dataset',
    description: 'MuJoCo 仿真数据集',
  },
  {
    id: '23.3 Isaac Sim 数据集',
    name: 'Isaac Sim 数据集',
    icon: '🎮',
    type: 'dataset',
    description: 'Isaac Sim 仿真数据集',
  },
  {
    id: '23.4 新增具身智能数据集（2025年）',
    name: '2025年新增数据集',
    icon: '🆕',
    type: 'dataset',
    description: '2025年新增具身智能数据集',
  },
  {
    id: '24.1 机器人遥操作数据集',
    name: '机器人遥操作数据集',
    icon: '🎮',
    type: 'dataset',
    description: '机器人遥操作数据集',
  },
  {
    id: '24.2 多模态感知数据集',
    name: '多模态感知数据集',
    icon: '👁️',
    type: 'dataset',
    description: '多模态感知数据集',
  },
  {
    id: '24.3 家庭服务机器人数据集',
    name: '家庭服务机器人数据集',
    icon: '🏠',
    type: 'dataset',
    description: '家庭服务机器人数据集',
  },
  {
    id: '24.4 工业机器人数据集',
    name: '工业机器人数据集',
    icon: '🏭',
    type: 'dataset',
    description: '工业机器人数据集',
  },
  {
    id: '24.5 医疗机器人数据集',
    name: '医疗机器人数据集',
    icon: '🏥',
    type: 'dataset',
    description: '医疗机器人数据集',
  },
  {
    id: '24.6 农业机器人数据集',
    name: '农业机器人数据集',
    icon: '🌾',
    type: 'dataset',
    description: '农业机器人数据集',
  },
  {
    id: '24.7 自动驾驶数据集',
    name: '自动驾驶数据集',
    icon: '🚗',
    type: 'dataset',
    description: '自动驾驶数据集',
  },
  {
    id: '24.8 空中机器人数据集',
    name: '空中机器人数据集',
    icon: '🚁',
    type: 'dataset',
    description: '空中机器人数据集',
  },
  {
    id: '24.9 水下机器人数据集',
    name: '水下机器人数据集',
    icon: '🤿',
    type: 'dataset',
    description: '水下机器人数据集',
  },
  {
    id: '24.10 仓储物流机器人数据集',
    name: '仓储物流机器人数据集',
    icon: '📦',
    type: 'dataset',
    description: '仓储物流机器人数据集',
  },
];

const getContentTypeLabel = (type?: string) => {
  if (!type || type === 'model') return '模型';
  if (type === 'dataset') return '数据集';
  if (type === 'space') return '空间';
  return '模型';
};

const getTaskColor = (taskName: string | undefined) => {
  if (!taskName) return '#8c8c8c';
  const colors: Record<string, string> = {
    'robotics': '#d46b08',
    'object-detection': '#1890ff',
    'image-segmentation': '#722ed1',
    'depth-estimation': '#13c2c2',
    'reinforcement-learning': '#52c41a',
    'video-classification': '#eb2f96',
    'image-classification': '#9254de',
    'feature-extraction': '#597ef7',
    'text-generation': '#2db7f5',
    'speech-recognition': '#fa8c16',
    'text-classification': '#87d068',
    'translation': '#36cfc9',
    'fill-mask': '#f759ab',
    'question-answering': '#faad14',
  };
  return colors[taskName] || '#8c8c8c';
};

const formatNumber = (num: number | undefined) => {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const HF_LOGO_COLOR = '#ff9d00';
const PAGE_SIZE = 24;

export default function HuggingFacePage() {
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<HuggingFaceModel[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<SortType>('latest');
  const [contentType, setContentType] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedAuthor, setSelectedAuthor] = useState<string | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const { user, isAuthenticated, hydrated } = useAuthStore();
  const { message: messageApi } = App.useApp();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set());

  const [taskStats, setTaskStats] = useState<Record<string, number>>({});

  const [subscribedAuthors, setSubscribedAuthors] = useState<Array<{
    id: string;
    author: string;
    authorUrl: string;
    isActive: boolean;
    createdAt: string;
  }>>([]);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [subscribedAuthorsContent, setSubscribedAuthorsContent] = useState<Array<{
    author: string;
    authorUrl: string;
    items: HuggingFaceModel[];
    total: number;
  }>>([]);
  const [loadingSubscribedContent, setLoadingSubscribedContent] = useState(false);
  const [showSubscribedContent, setShowSubscribedContent] = useState(false);
  const [authorInput, setAuthorInput] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [hfUrl, setHfUrl] = useState('');
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [modelPreview, setModelPreview] = useState<HuggingFaceModelPreview | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitForm] = Form.useForm();

  useEffect(() => {
    clearCache('/huggingface');
    loadModels(1, true);
  }, [sort, contentType, selectedCategory, selectedAuthor]);

  useEffect(() => {
    loadTaskStats();
  }, []);

  const loadTaskStats = async () => {
    try {
      const stats = await huggingfaceApi.getTaskTypeStats();
      setTaskStats(stats);
    } catch {
      // 静默失败
    }
  };

  const [hasNewContent, setHasNewContent] = useState(false);
  const HF_LAST_VISIT_KEY = 'huggingface_last_visit';
  useEffect(() => {
    const latest = taskStats.latestUpdatedAt;
    if (!latest) return;
    const lastVisit = typeof window !== 'undefined' ? localStorage.getItem(HF_LAST_VISIT_KEY) : null;
    const lastVisitTime = lastVisit ? new Date(lastVisit).getTime() : 0;
    const latestTime = new Date(latest).getTime();
    setHasNewContent(latestTime > lastVisitTime);
  }, [taskStats.latestUpdatedAt]);
  
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(HF_LAST_VISIT_KEY, new Date().toISOString());
      }
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (user && isAuthenticated) {
      loadFavorites();
      loadFollowed();
      loadSubscriptions();
    } else {
      setFavoriteIds(new Set());
      setFollowedIds(new Set());
      setSubscribedAuthors([]);
    }
  }, [user, isAuthenticated, hydrated]);

  const loadModels = async (pageNum: number, reset = false) => {
    setLoading(true);
    try {
      const data = await huggingfaceApi.getModels({
        page: pageNum,
        size: PAGE_SIZE,
        sort,
        contentType: contentType as 'model' | 'dataset' | 'space' | undefined,
        keyword: keyword || undefined,
        author: selectedAuthor || undefined,
        category: selectedCategory || undefined,
      });

      if (!data || !data.items || !Array.isArray(data.items)) {
        if (reset) setModels([]);
        setTotal(0);
        return;
      }

      if (reset || pageNum === 1) {
        setModels(data.items);
      } else {
        setModels((prev) => [...prev, ...data.items]);
      }

      setPage(pageNum);
      setTotal(data.pagination?.total || 0);
    } catch {
      if (reset) setModels([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setKeyword(searchInput);
    loadModels(1, true);
  };

  const handlePageChange = (newPage: number) => {
    loadModels(newPage, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContentTypeChange = (value: string | undefined) => {
    setContentType(value);
    setSelectedCategory(undefined);
    setPage(1);
  };

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(undefined);
    } else {
      setSelectedCategory(categoryId);
    }
    setPage(1);
  };

  const loadFavorites = async () => {
    try {
      const data = await communityApi.getFavorites({ page: 1, size: 200, contentType: 'huggingface' });
      const ids = new Set((data.items || []).map((fav: any) => fav.contentId));
      setFavoriteIds(ids);
    } catch {
      // 静默失败
    }
  };

  const loadFollowed = async () => {
    try {
      const data = await contentSubscriptionApi.getSubscriptions({ contentType: 'huggingface', size: 500 });
      const ids = new Set((data.items || []).map((s) => s.contentId));
      setFollowedIds(ids);
    } catch {
      // 静默失败
    }
  };

  const loadSubscriptions = async () => {
    try {
      const data = await huggingfaceApi.getMySubscriptions();
      setSubscribedAuthors(data.authors || []);
    } catch {
      // 静默失败
    }
  };

  const loadSubscribedAuthorsContent = async () => {
    if (!user) return;
    setLoadingSubscribedContent(true);
    try {
      const data = await huggingfaceApi.getSubscribedAuthorsContent();
      setSubscribedAuthorsContent(data.authors || []);
      setShowSubscribedContent(true);
    } catch (error: any) {
      messageApi.error(error.message || '加载订阅作者内容失败');
    } finally {
      setLoadingSubscribedContent(false);
    }
  };

  const handleToggleFavorite = (modelId: string) => {
    if (!user) { messageApi.warning('请先登录'); return; }
    const already = favoriteIds.has(modelId);
    const action = already
      ? communityApi.deleteFavorite('huggingface', modelId)
      : communityApi.createFavorite({ contentType: 'huggingface', contentId: modelId });
    action
      .then(() => {
        messageApi.success(already ? '已取消收藏' : '收藏成功！');
        loadFavorites();
      })
      .catch((error: any) => {
        messageApi.error(error.message || (already ? '取消收藏失败' : '收藏失败'));
      });
  };

  const handleToggleFollow = async (modelId: string) => {
    if (!user) { messageApi.warning('请先登录'); return; }
    const already = followedIds.has(modelId);
    setFollowLoading((prev) => new Set(prev).add(modelId));
    try {
      if (already) {
        await contentSubscriptionApi.deleteSubscription('huggingface', modelId);
        setFollowedIds((prev) => { const next = new Set(prev); next.delete(modelId); return next; });
        messageApi.success('已取消关注');
      } else {
        await contentSubscriptionApi.createSubscription({ contentType: 'huggingface', contentId: modelId });
        setFollowedIds((prev) => new Set(prev).add(modelId));
        messageApi.success('已关注，将收到更新通知');
      }
    } catch (error: any) {
      messageApi.error(error.message || (already ? '取消关注失败' : '关注失败'));
    } finally {
      setFollowLoading((prev) => { const next = new Set(prev); next.delete(modelId); return next; });
    }
  };

  const handleSubscribeAuthor = async () => {
    if (!user) {
      messageApi.warning('请先登录后再订阅作者');
      return;
    }
    if (!authorInput.trim()) {
      messageApi.warning('请输入作者名称');
      return;
    }
    if (typeof window !== 'undefined' && !localStorage.getItem('user_token')) {
      messageApi.warning('登录已过期，请重新登录');
      return;
    }
    setSubscribing(true);
    try {
      const result = await huggingfaceApi.subscribeAuthor(authorInput.trim());
      messageApi.success(result.message);
      setAuthorInput('');
      loadSubscriptions();
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('登录') || msg.includes('401') || error?.status === 401) {
        messageApi.error('登录已过期，请重新登录');
      } else {
        messageApi.error(msg || '订阅失败');
      }
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribeAuthor = async (subscriptionId: string) => {
    setSubscribing(true);
    try {
      await huggingfaceApi.unsubscribeAuthor(subscriptionId);
      messageApi.success('已取消订阅');
      loadSubscriptions();
    } catch (error: any) {
      messageApi.error(error.message || '取消订阅失败');
    } finally {
      setSubscribing(false);
    }
  };

  const handleFetchModelInfo = async () => {
    if (!hfUrl.trim()) { messageApi.warning('请输入 HuggingFace URL'); return; }
    setFetchingInfo(true);
    setModelPreview(null);
    try {
      const info = await huggingfaceApi.getModelInfoFromUrl(hfUrl.trim());
      setModelPreview(info);
      submitForm.setFieldsValue({ description: info.description || '' });
      const contentTypeLabel = info.contentType === 'dataset' ? '数据集' : info.contentType === 'space' ? '空间' : '模型';
      messageApi.success(`获取${contentTypeLabel}信息成功！`);
    } catch (error: any) {
      messageApi.error(error.message || '获取项目信息失败，请检查 URL 是否正确');
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleSubmitModel = async (values: any) => {
    if (!modelPreview) { messageApi.warning('请先解析项目信息'); return; }
    setSubmitting(true);
    try {
      const result = await huggingfaceApi.submitModel({
        fullName: modelPreview.id || modelPreview.fullName || modelPreview.modelId,
        description: values.description || modelPreview.description,
        task: modelPreview.pipeline_tag,
        downloads: modelPreview.downloads,
        likes: modelPreview.likes,
        lastModified: modelPreview.lastModified,
        hfId: modelPreview.modelId || modelPreview.id,
        name: modelPreview.name,
        author: modelPreview.author,
        license: modelPreview.license,
        tags: modelPreview.tags,
        contentType: modelPreview.contentType || 'model',
      });
      if (result.alreadyExists) {
        messageApi.info(result.message);
      } else {
        messageApi.success(result.message);
        loadModels(1, true);
      }
      setSubmitModalOpen(false);
      setHfUrl('');
      setModelPreview(null);
      submitForm.resetFields();
    } catch (error: any) {
      messageApi.error(error.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryLabel = () => {
    if (selectedCategory) {
      const cat = RESOURCE_CATEGORIES.find(c => c.id === selectedCategory);
      if (cat) return cat.name;
    }
    if (contentType === 'dataset') return '数据集';
    if (contentType === 'space') return '空间';
    return 'HuggingFace 模型';
  };
  
  const currentCategoryLabel = getCategoryLabel();
  const subscriptionCount = subscribedAuthors.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getHuggingFaceUrl = (model: HuggingFaceModel) => {
    const contentType = model.contentType || 'model';
    if (contentType === 'dataset') {
      return `https://huggingface.co/datasets/${model.fullName}`;
    } else if (contentType === 'space') {
      return `https://huggingface.co/spaces/${model.fullName}`;
    }
    return `https://huggingface.co/${model.fullName}`;
  };

  const modelCategories = RESOURCE_CATEGORIES.filter(c => c.type === 'model');
  const datasetCategories = RESOURCE_CATEGORIES.filter(c => c.type === 'dataset');

  return (
    <PageContainer loading={loading && models.length === 0}>
      <div className={styles.container}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarSectionTitle}>
                内容类型
                {hasNewContent && <span className={styles.newBadge} title="有新内容" />}
              </div>
              <div className={styles.topicList}>
                {CONTENT_TYPES.map((t) => {
                  const count = t.value ? (taskStats[t.value] || 0) : (taskStats['all'] || 0);
                  return (
                    <button
                      key={t.id}
                      className={`${styles.topicItem} ${contentType === t.value ? styles.topicItemActive : ''}`}
                      onClick={() => handleContentTypeChange(t.value)}
                    >
                      <span className={styles.topicLabel}>{t.label}</span>
                      <span className={styles.topicCount}>({count})</span>
                      {contentType === t.value && <span className={styles.topicDot} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.sidebarSection}>
              <div className={styles.sidebarSectionTitle}>模型分类</div>
              <div className={styles.categoryList}>
                {modelCategories.map((category) => {
                  const isActive = selectedCategory === category.id;
                  const count = taskStats[category.id] || 0;
                  return (
                    <button
                      key={category.id}
                      className={`${styles.categoryItemSimple} ${isActive ? styles.categoryItemSimpleActive : ''}`}
                      onClick={() => handleCategoryClick(category.id)}
                      title={category.description}
                    >
                      <span className={styles.categoryEmoji}>{category.icon}</span>
                      <span className={styles.categoryName}>{category.name}</span>
                      {count > 0 && <span className={styles.categoryCount}>({count})</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.sidebarSection}>
              <div className={styles.sidebarSectionTitle}>数据集分类</div>
              <div className={styles.categoryList}>
                {datasetCategories.map((category) => {
                  const isActive = selectedCategory === category.id;
                  const count = taskStats[category.id] || 0;
                  return (
                    <button
                      key={category.id}
                      className={`${styles.categoryItemSimple} ${isActive ? styles.categoryItemSimpleActive : ''}`}
                      onClick={() => handleCategoryClick(category.id)}
                      title={category.description}
                    >
                      <span className={styles.categoryEmoji}>{category.icon}</span>
                      <span className={styles.categoryName}>{category.name}</span>
                      {count > 0 && <span className={styles.categoryCount}>({count})</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.sidebarSection}>
              <div className={styles.sidebarSectionTitle}>排序方式</div>
              <div className={styles.sortList}>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`${styles.sortItem} ${sort === opt.value ? styles.sortItemActive : ''}`}
                    onClick={() => setSort(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.sidebarSection}>
              <div className={styles.statsCard}>
                <div className={styles.statsNumber}>{total.toLocaleString()}</div>
                <div className={styles.statsLabel}>个模型/数据集</div>
                <div className={styles.statsDesc}>机器人 · 感知 · 强化学习</div>
              </div>
            </div>
          </aside>

          <main className={styles.main}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <h1 className={styles.pageTitle}>
                  {selectedAuthor ? `${selectedAuthor} 的内容` : currentCategoryLabel}
                  {selectedAuthor && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        setSelectedAuthor(undefined);
                        loadModels(1, true);
                      }}
                      style={{ marginLeft: 8, fontSize: 12 }}
                    >
                      清除筛选
                    </Button>
                  )}
                </h1>
              </div>
              <div className={styles.toolbarRight}>
                <Input.Search
                  placeholder="搜索模型名称、作者..."
                  className={styles.searchInput}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onSearch={handleSearch}
                  allowClear
                />
                {isAuthenticated && (
                  <Button
                    icon={<HeartOutlined />}
                    onClick={() => {
                      window.location.href = '/favorites?contentType=huggingface';
                    }}
                    style={{ borderRadius: 8, height: 36 }}
                  >
                    我的收藏
                  </Button>
                )}
                <Button
                  icon={<BellOutlined />}
                  onClick={() => setSubscriptionModalOpen(true)}
                  style={{
                    borderRadius: 8,
                    height: 36,
                    background: subscriptionCount > 0 ? '#fff7e6' : undefined,
                    borderColor: subscriptionCount > 0 ? '#d46b08' : undefined,
                    color: subscriptionCount > 0 ? '#d46b08' : undefined,
                  }}
                >
                  {subscriptionCount > 0 ? `已订阅 ${subscriptionCount} 位作者` : '订阅作者'}
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  style={{ background: HF_LOGO_COLOR, borderColor: HF_LOGO_COLOR, borderRadius: 8, height: 36 }}
                  onClick={() => {
                    if (!isAuthenticated) {
                      messageApi.warning('请先登录后再提交项目');
                      return;
                    }
                    setSubmitModalOpen(true);
                  }}
                >
                  提交项目
                </Button>
              </div>
            </div>

            {!loading && models.length > 0 && (
              <div className={styles.resultInfo}>
                共 <strong>{total.toLocaleString()}</strong> 个{contentType === 'dataset' ? '数据集' : contentType === 'space' ? '空间' : '模型'}
                {selectedCategory && <> · {currentCategoryLabel}</>}
              </div>
            )}

            {loading && models.length === 0 ? (
              <div className={styles.cardGrid}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className={styles.modelCard}>
                    <Skeleton active paragraph={{ rows: 3 }} />
                  </div>
                ))}
              </div>
            ) : models.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span style={{ color: '#8c8c8c', fontSize: 15 }}>暂无 HuggingFace 模型</span>}
                style={{ padding: '80px 0' }}
              />
            ) : (
              <>
                <div className={styles.cardGrid}>
                  {models.map((model) => {
                    const isFav = favoriteIds.has(model.id);
                    const isFollowed = followedIds.has(model.id);
                    const isFollowLoading = followLoading.has(model.id);
                    return (
                      <div key={model.id} className={styles.modelCard}>
                        <a
                          href={model.fullName ? getHuggingFaceUrl(model) : '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.modelTitle}
                        >
                          {model.fullName}
                        </a>

                        <div className={styles.modelMetaRow}>
                          <span className={styles.contentTypeTag} data-type={model.contentType || 'model'}>
                            {getContentTypeLabel(model.contentType)}
                          </span>
                          {model.task && (
                            <span
                              className={styles.modelTaskTag}
                              style={{ background: getTaskColor(model.task) }}
                            >
                              {model.task}
                            </span>
                          )}
                        </div>

                        {model.description && (
                          <div className={styles.modelDescription}>{model.description}</div>
                        )}

                        <div className={styles.modelStats}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            ↓ {formatNumber(model.downloads)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            ♥ {formatNumber(model.likes)}
                          </span>
                          {(model.lastModified || model.updatedAt) && (
                            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, ...getDateStyle(model.lastModified || model.updatedAt) }}>
                              {formatFreshDate(model.lastModified || model.updatedAt, 'MM-DD')}
                            </span>
                          )}
                        </div>

                        {model.author && (
                          <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <UserOutlined style={{ fontSize: 10 }} />
                            <a
                              href={`https://huggingface.co/${model.author}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAuthor(model.author || undefined);
                                loadModels(1, true);
                              }}
                              style={{ color: '#8c8c8c', textDecoration: 'none' }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#1890ff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = '#8c8c8c'; }}
                            >
                              {model.author}
                            </a>
                          </div>
                        )}
                        <div className={styles.modelFooter}>
                          <a
                            href={model.fullName ? getHuggingFaceUrl(model) : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.modelLink}
                          >
                            <LinkOutlined /> 查看详情
                          </a>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className={`${styles.favoriteBtn} ${isFollowed ? styles.followBtnActive : ''}`}
                              onClick={() => handleToggleFollow(model.id)}
                              disabled={isFollowLoading}
                              title={isFollowed ? '取消关注，不再收到更新通知' : '关注此模型，有更新时收到通知'}
                            >
                              {isFollowed
                                ? <EyeOutlined style={{ fontSize: 11, color: '#1890ff' }} />
                                : <EyeInvisibleOutlined style={{ fontSize: 11 }} />
                              }
                              {isFollowed ? '已关注' : '关注'}
                            </button>
                            <button
                              className={`${styles.favoriteBtn} ${isFav ? styles.favoriteBtnActive : ''}`}
                              onClick={() => handleToggleFavorite(model.id)}
                            >
                              {isFav ? <HeartFilled style={{ fontSize: 11 }} /> : <HeartOutlined style={{ fontSize: 11 }} />}
                              {isFav ? '已收藏' : '收藏'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className={styles.paginationWrapper}>
                    <Pagination
                      current={page}
                      total={total}
                      pageSize={PAGE_SIZE}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      showQuickJumper
                      showTotal={(total) => `共 ${total} 条`}
                      style={{ marginTop: 24 }}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* 订阅弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BellOutlined style={{ color: '#d46b08' }} />
            <span>订阅作者</span>
          </div>
        }
        open={subscriptionModalOpen}
        onCancel={() => setSubscriptionModalOpen(false)}
        footer={null}
        width={560}
      >
        {!user ? (
          <div className={styles.loginPrompt}>
            <p className={styles.loginPromptText}>请先登录以管理订阅</p>
            <Link href="/login">
              <Button type="primary">去登录</Button>
            </Link>
          </div>
        ) : (
          <div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div className={styles.subscriptionTitle}>
                    <UserOutlined style={{ marginRight: 6, color: '#52c41a' }} />
                    订阅作者
                  </div>
                  <div className={styles.subscriptionDescription}>作者发布新模型时，您将收到通知</div>
                </div>
                {subscribedAuthors.length > 0 && (
                  <Button
                    type="link"
                    onClick={loadSubscribedAuthorsContent}
                    loading={loadingSubscribedContent}
                    icon={<EyeOutlined />}
                  >
                    查看新动态
                  </Button>
                )}
              </div>

              <div className={styles.authorSubscriptionInput}>
                <Input
                  placeholder="输入 HuggingFace 作者名称，如：meta-llama、UC-Berkeley-AI"
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  onPressEnter={handleSubscribeAuthor}
                  prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                />
                <Button type="primary" onClick={handleSubscribeAuthor} loading={subscribing} icon={<PlusOutlined />}
                  style={{ background: '#d46b08', borderColor: '#d46b08' }}>
                  订阅
                </Button>
              </div>

              {subscribedAuthors.length > 0 && (
                <List
                  size="small"
                  dataSource={subscribedAuthors}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          key="unsubscribe"
                          type="link"
                          danger
                          size="small"
                          onClick={() => handleUnsubscribeAuthor(item.id)}
                          icon={<DeleteOutlined />}
                        >
                          取消
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div className={styles.authorAvatar}>
                            <UserOutlined style={{ color: '#d46b08', fontSize: 13 }} />
                          </div>
                        }
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <a
                              href={item.authorUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#262626' }}
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedAuthor(item.author);
                                setSubscriptionModalOpen(false);
                                loadModels(1, true);
                              }}
                            >
                              {item.author}
                            </a>
                            <Button
                              type="link"
                              size="small"
                              onClick={() => {
                                setSelectedAuthor(item.author);
                                setSubscriptionModalOpen(false);
                                loadModels(1, true);
                              }}
                              style={{ padding: 0, fontSize: 12 }}
                            >
                              筛选
                            </Button>
                          </div>
                        }
                        description={`订阅于 ${new Date(item.createdAt).toLocaleDateString()}`}
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 订阅作者新动态弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BellOutlined style={{ color: '#d46b08' }} />
            <span>我订阅作者的新动态</span>
          </div>
        }
        open={showSubscribedContent}
        onCancel={() => setShowSubscribedContent(false)}
        footer={null}
        width={800}
      >
        {loadingSubscribedContent ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </div>
        ) : subscribedAuthorsContent.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无订阅作者的新内容"
            style={{ padding: '40px 0' }}
          />
        ) : (
          <div>
            {subscribedAuthorsContent.map((authorData) => (
              <div key={authorData.author} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <UserOutlined style={{ color: '#d46b08' }} />
                  <a
                    href={authorData.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}
                  >
                    {authorData.author}
                  </a>
                  <span style={{ color: '#8c8c8c', fontSize: 13 }}>
                    ({authorData.total} 个)
                  </span>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      setSelectedAuthor(authorData.author);
                      setShowSubscribedContent(false);
                      loadModels(1, true);
                    }}
                    style={{ marginLeft: 'auto' }}
                  >
                    查看全部
                  </Button>
                </div>
                {authorData.items.length > 0 ? (
                  <div className={styles.cardGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                    {authorData.items.slice(0, 6).map((model) => {
                      const isFav = favoriteIds.has(model.id);
                      return (
                        <div key={model.id} className={styles.modelCard}>
                          <a
                            href={model.fullName ? getHuggingFaceUrl(model) : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.modelTitle}
                          >
                            {model.fullName}
                          </a>
                          <div className={styles.modelMetaRow}>
                            <span className={styles.contentTypeTag} data-type={model.contentType || 'model'}>
                              {getContentTypeLabel(model.contentType)}
                            </span>
                            {model.task && (
                              <span
                                className={styles.modelTaskTag}
                                style={{ background: getTaskColor(model.task) }}
                              >
                                {model.task}
                              </span>
                            )}
                          </div>
                          {model.description && (
                            <div className={styles.modelDescription}>{model.description}</div>
                          )}
                          <div className={styles.modelStats}>
                            <span>↓ {formatNumber(model.downloads)}</span>
                            <span>♥ {formatNumber(model.likes)}</span>
                          </div>
                          <div className={styles.modelFooter}>
                            <button
                              className={`${styles.favoriteBtn} ${isFav ? styles.favoriteBtnActive : ''}`}
                              onClick={() => handleToggleFavorite(model.id)}
                            >
                              {isFav ? <HeartFilled style={{ fontSize: 11 }} /> : <HeartOutlined style={{ fontSize: 11 }} />}
                              {isFav ? '已收藏' : '收藏'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: '#8c8c8c', padding: '20px 0', textAlign: 'center' }}>
                    暂无新内容
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* 提交项目弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RobotOutlined style={{ fontSize: 18, color: HF_LOGO_COLOR }} />
            <span>提交 HuggingFace 项目</span>
          </div>
        }
        open={submitModalOpen}
        onCancel={() => {
          setSubmitModalOpen(false);
          setHfUrl('');
          setModelPreview(null);
          submitForm.resetFields();
        }}
        footer={null}
        width={620}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 12 }}>
            粘贴 HuggingFace 模型/数据集/空间的链接，点击「解析」获取信息后提交。
            <br />
            模型示例：<code style={{ background: '#f5f5f5', padding: '1px 6px', borderRadius: 4 }}>https://huggingface.co/meta-llama/Llama-3.2-1B</code>
            <br />
            数据集示例：<code style={{ background: '#f5f5f5', padding: '1px 6px', borderRadius: 4 }}>https://huggingface.co/datasets/author/dataset-name</code>
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="粘贴 HuggingFace URL..."
              value={hfUrl}
              onChange={(e) => { setHfUrl(e.target.value); setModelPreview(null); }}
              onPressEnter={handleFetchModelInfo}
              size="large"
              prefix={<LinkOutlined style={{ color: '#bfbfbf' }} />}
              style={{ flex: 1 }}
            />
            <Button
              type="primary"
              onClick={handleFetchModelInfo}
              loading={fetchingInfo}
              size="large"
              style={{ background: HF_LOGO_COLOR, borderColor: HF_LOGO_COLOR, borderRadius: 8 }}
            >
              解析
            </Button>
          </div>
        </div>

        {modelPreview && (
          <Form form={submitForm} layout="vertical" onFinish={handleSubmitModel}>
            {modelPreview.fromApi === false && (
              <div style={{
                background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8,
                padding: '8px 14px', marginBottom: 12, fontSize: 12, color: '#8c6b00',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>⚠</span>
                <span>HuggingFace API 响应超时，仅显示从 URL 解析的基础信息。提交后系统将在后台自动同步详情。</span>
              </div>
            )}
            <Card
              style={{ marginBottom: 16, background: '#fffbf0', border: '1px solid #ffe58f', borderRadius: 10 }}
              bodyStyle={{ padding: 16 }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: HF_LOGO_COLOR, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>
                  <RobotOutlined style={{ fontSize: 20, color: '#fff' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#262626', marginBottom: 4 }}>
                    {modelPreview.id || modelPreview.fullName || modelPreview.modelId}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
                    作者：{modelPreview.author}
                  </div>
                  {modelPreview.description ? (
                    <div style={{ fontSize: 13, color: '#57606a', lineHeight: 1.5, marginBottom: 8 }}>
                      {modelPreview.description.slice(0, 120)}{modelPreview.description.length > 120 ? '...' : ''}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#bfbfbf', lineHeight: 1.5, marginBottom: 8 }}>
                      暂无描述，可在下方补充
                    </div>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {modelPreview.pipeline_tag && (
                      <Tag style={{ background: getTaskColor(modelPreview.pipeline_tag), color: '#fff', border: 'none', borderRadius: 5, fontSize: 11 }}>
                        {modelPreview.pipeline_tag}
                      </Tag>
                    )}
                    {modelPreview.license && (
                      <Tag style={{ background: '#f5f5f5', color: '#595959', border: '1px solid #e8e8e8', borderRadius: 5, fontSize: 11 }}>
                        {modelPreview.license}
                      </Tag>
                    )}
                    {modelPreview.downloads > 0 && <span style={{ fontSize: 12, color: '#8c8c8c' }}>↓ {formatNumber(modelPreview.downloads)}</span>}
                    {modelPreview.likes > 0 && <span style={{ fontSize: 12, color: '#8c8c8c' }}>♥ {formatNumber(modelPreview.likes)}</span>}
                  </div>
                </div>
              </div>
            </Card>

            <Form.Item name="description" label="补充描述（可选）">
              <Input.TextArea
                placeholder={`可以补充${modelPreview.contentType === 'dataset' ? '数据集' : modelPreview.contentType === 'space' ? '空间' : '模型'}的应用场景、推荐理由等...`}
                rows={3}
                showCount
                maxLength={500}
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => {
                setSubmitModalOpen(false);
                setHfUrl('');
                setModelPreview(null);
                submitForm.resetFields();
              }}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{ background: HF_LOGO_COLOR, borderColor: HF_LOGO_COLOR }}
              >
                提交{modelPreview.contentType === 'dataset' ? '数据集' : modelPreview.contentType === 'space' ? '空间' : '模型'}
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </PageContainer>
  );
}
