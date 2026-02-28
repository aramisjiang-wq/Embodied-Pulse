/**
 * Bilibili搜索词管理页面
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Space,
  Tag,
  Popconfirm,
  Switch,
  Select,
  InputNumber,
  App,
  message,
  Tooltip,
  Card,
  Statistic,
  Row,
  Col,
  Upload,
  Alert,
  Tabs,
  List,
  Avatar,
  Typography,
  Divider,
  Progress,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  VideoCameraOutlined,
  EyeOutlined,
  CloseOutlined,
  ThunderboltOutlined,
  CloudDownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  ChromeOutlined,
  LoadingOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  WarningFilled,
} from '@ant-design/icons';
import { bilibiliSearchKeywordApi, BilibiliSearchKeyword, CreateKeywordData, KeywordStats } from '@/lib/api/bilibili-search-keyword';
import { cookieApi, CookieStatus } from '@/lib/api/cookie';
import { getProxyImageUrl } from '@/utils/image-proxy';
import dayjs from 'dayjs';
import styles from './page.module.css';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const CATEGORIES = [
  { value: '核心概念', label: '核心概念' },
  { value: '技术相关', label: '技术相关' },
  { value: '应用场景', label: '应用场景' },
  { value: '学习方法', label: '学习方法' },
  { value: '任务类型', label: '任务类型' },
];

interface SyncProgress {
  isRunning: boolean;
  currentKeyword: string;
  currentIndex: number;
  totalKeywords: number;
  syncedVideos: number;
  errors: number;
  stages: { keyword: string; status: 'pending' | 'running' | 'success' | 'error'; videos: number }[];
  logs: { time: string; type: 'info' | 'success' | 'error'; message: string }[];
}

interface LogEntry {
  time: string;
  type: 'info' | 'success' | 'error';
  message: string;
}

export default function BilibiliSearchKeywordsPage() {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<BilibiliSearchKeyword[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<KeywordStats | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<BilibiliSearchKeyword | null>(null);
  const [form] = Form.useForm();
  const [exportLoading, setExportLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFileList, setImportFileList] = useState<any[]>([]);
  const [videosModalVisible, setVideosModalVisible] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<BilibiliSearchKeyword | null>(null);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videos, setVideos] = useState<any[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);

  const [cookieStatus, setCookieStatus] = useState<CookieStatus | null>(null);
  const [cookieLoading, setCookieLoading] = useState(false);
  const [manualCookieModalVisible, setManualCookieModalVisible] = useState(false);
  const [cookieForm] = Form.useForm();

  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    isRunning: false,
    currentKeyword: '',
    currentIndex: 0,
    totalKeywords: 0,
    syncedVideos: 0,
    errors: 0,
    stages: [],
    logs: [],
  });

  useEffect(() => {
    loadKeywords();
    loadStats();
    loadCookieStatus();
  }, [page, pageSize, categoryFilter, statusFilter, searchKeyword]);

  useEffect(() => {
    if (syncProgress.isRunning) {
      const interval = setInterval(() => {
        pollSyncProgress();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [syncProgress.isRunning]);

  const addLog = (type: LogEntry['type'], message: string) => {
    setSyncProgress(prev => ({
      ...prev,
      logs: [
        { time: dayjs().format('HH:mm:ss'), type, message },
        ...prev.logs.slice(0, 99),
      ],
    }));
  };

  const loadStats = async () => {
    try {
      const statsData = await bilibiliSearchKeywordApi.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const loadCookieStatus = async () => {
    setCookieLoading(true);
    try {
      const status = await cookieApi.getCookieStatus();
      setCookieStatus(status);
    } catch (error: any) {
      console.error('Load cookie status error:', error);
    } finally {
      setCookieLoading(false);
    }
  };

  const loadKeywords = async () => {
    setLoading(true);
    try {
      const response = await bilibiliSearchKeywordApi.getKeywords({
        page,
        size: pageSize,
        category: categoryFilter || undefined,
        isActive: statusFilter,
        keyword: searchKeyword || undefined,
      });
      const data = response?.data;
      const items = Array.isArray(data?.items) ? data.items : [];
      const totalCount = typeof data?.pagination?.total === 'number' ? data.pagination.total : 0;
      setKeywords(items);
      setTotal(totalCount);
    } catch (error: any) {
      console.error('Load keywords error:', error);
      messageApi.error(error?.message || '加载失败');
      setKeywords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadVideosForKeyword = async (keyword: BilibiliSearchKeyword) => {
    setSelectedKeyword(keyword);
    setVideosModalVisible(true);
    setVideosLoading(true);
    setVideos([]);
    
    try {
      const response = await fetch(`http://localhost:3001/api/v1/videos?platform=bilibili&keyword=${encodeURIComponent(keyword.keyword)}&page=1&size=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      const data = await response.json();
      
      if (data.code === 0) {
        setVideos(data.data.items || []);
      } else {
        messageApi.error(data.message || '加载视频失败');
      }
    } catch (error: any) {
      console.error('Load videos error:', error);
      messageApi.error(error.message || '加载视频失败');
    } finally {
      setVideosLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await bilibiliSearchKeywordApi.getKeywords({
        page: 1,
        size: 10000,
        category: categoryFilter || undefined,
        isActive: statusFilter,
        keyword: searchKeyword || undefined,
      });
      const items = Array.isArray(response?.data?.items) ? response.data.items : [];
      
      const csvContent = [
        ['关键词', '分类', '优先级', '状态', '描述', '创建时间'].join(','),
        ...items.map((item: BilibiliSearchKeyword) => [
          `"${item.keyword}"`,
          `"${item.category || ''}"`,
          item.priority,
          item.isActive ? '启用' : '禁用',
          `"${item.description || ''}"`,
          dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        ].join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `bilibili-search-keywords-${dayjs().format('YYYYMMDDHHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      messageApi.success('导出成功');
    } catch (error: any) {
      console.error('Export error:', error);
      messageApi.error(error.message || '导出失败');
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = async (file: any) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        if (!headers.includes('keyword')) {
          messageApi.error('CSV文件格式错误，必须包含keyword列');
          return;
        }

        const keywordsToImport: CreateKeywordData[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',');
          const keywordData: any = {};
          
          headers.forEach((header: string, index: number) => {
            keywordData[header.trim()] = values[index]?.replace(/"/g, '').trim();
          });
          
          if (keywordData.keyword) {
            keywordsToImport.push({
              keyword: keywordData.keyword,
              category: keywordData.category || undefined,
              priority: parseInt(keywordData.priority) || 0,
              isActive: keywordData.isActive === '启用' || keywordData.isActive === 'true',
              description: keywordData.description || undefined,
            });
          }
        }

        if (keywordsToImport.length === 0) {
          messageApi.error('没有找到有效的关键词数据');
          return;
        }

        const result = await bilibiliSearchKeywordApi.batchCreateKeywords(keywordsToImport);
        
        const resultData = result.data as { errors?: unknown[]; success?: unknown[] } | undefined;
        if (resultData?.errors && Array.isArray(resultData.errors) && resultData.errors.length > 0) {
          messageApi.warning(`导入完成：成功 ${resultData.success?.length || 0} 个，失败 ${resultData.errors.length} 个`);
        } else {
          messageApi.success(`导入成功：共 ${keywordsToImport.length} 个关键词`);
        }
        
        setImportModalVisible(false);
        setImportFileList([]);
        loadKeywords();
        loadStats();
      } catch (error: any) {
        console.error('Import error:', error);
        messageApi.error(error.response?.data?.message || error.message || '导入失败');
      }
    };
    
    reader.readAsText(file);
  };

  const handleEdit = (keyword: BilibiliSearchKeyword) => {
    setEditingKeyword(keyword);
    form.setFieldsValue({
      keyword: keyword.keyword,
      category: keyword.category,
      isActive: keyword.isActive,
      priority: keyword.priority,
      description: keyword.description,
    });
    setModalVisible(true);
  };

  const handleCreate = async (values: any) => {
    try {
      await bilibiliSearchKeywordApi.createKeyword({
        keyword: values.keyword.trim(),
        category: values.category || undefined,
        isActive: values.isActive !== undefined ? values.isActive : true,
        priority: values.priority || 0,
        description: values.description || undefined,
      });
      messageApi.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadKeywords();
      loadStats();
    } catch (error: any) {
      console.error('Create keyword error:', error);
      if (error.response?.data?.code === 5005) {
        messageApi.error('关键词已存在');
      } else {
        messageApi.error(error.response?.data?.message || error.message || '创建失败');
      }
    }
  };

  const handleUpdate = async (values: any) => {
    if (!editingKeyword) return;
    
    try {
      await bilibiliSearchKeywordApi.updateKeyword(editingKeyword.id, {
        keyword: values.keyword.trim(),
        category: values.category || undefined,
        isActive: values.isActive !== undefined ? values.isActive : undefined,
        priority: values.priority !== undefined ? values.priority : undefined,
        description: values.description || undefined,
      });
      messageApi.success('更新成功');
      setModalVisible(false);
      setEditingKeyword(null);
      form.resetFields();
      loadKeywords();
      loadStats();
    } catch (error: any) {
      console.error('Update keyword error:', error);
      if (error.response?.data?.code === 5005) {
        messageApi.error('关键词已存在');
      } else {
        messageApi.error(error.response?.data?.message || error.message || '更新失败');
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await bilibiliSearchKeywordApi.deleteKeyword(id);
      messageApi.success('删除成功');
      loadKeywords();
      loadStats();
    } catch (error: any) {
      console.error('Delete keyword error:', error);
      messageApi.error(error.response?.data?.message || error.message || '删除失败');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await bilibiliSearchKeywordApi.updateKeyword(id, {
        isActive: !currentStatus,
      });
      messageApi.success(currentStatus ? '已禁用' : '已启用');
      loadKeywords();
      loadStats();
    } catch (error: any) {
      console.error('Toggle status error:', error);
      messageApi.error(error.response?.data?.message || error.message || '操作失败');
      loadKeywords();
      loadStats();
    }
  };

  const pollSyncProgress = async () => {
    return;
  };

  const handleSyncVideos = async () => {
    setSyncLoading(true);
    setShowProgressPanel(true);
    setSyncProgress({
      isRunning: true,
      currentKeyword: '准备中...',
      currentIndex: 0,
      totalKeywords: 0,
      syncedVideos: 0,
      errors: 0,
      stages: [],
      logs: [{ time: dayjs().format('HH:mm:ss'), type: 'info', message: '正在启动视频同步任务...' }],
    });

    let retryCount = 0;
    const maxRetries = 2;
    
    const attemptSync = async (): Promise<{ success: boolean; message: string }> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        const response = await fetch('http://localhost:3001/api/v1/admin/sync/videos-by-keywords', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          },
          body: JSON.stringify({
            days: 7,
            maxResultsPerKeyword: 20,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (data.code === 0) {
          addLog('success', `同步成功：${data.data.synced} 个视频，${data.data.keywords} 个关键词`);
          return { success: true, message: `同步成功：${data.data.synced} 个视频，${data.data.keywords} 个关键词` };
        } else if (data.code === 429 || data.message?.includes('限流') || data.message?.includes('too many requests')) {
          if (retryCount < maxRetries) {
            retryCount++;
            addLog('error', `请求受限，${retryCount}秒后重试...`);
            messageApi.warning(`请求受限，${retryCount}秒后重试...`, 3);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return attemptSync();
          }
          addLog('error', data.message || '同步失败：请求过于频繁，请稍后再试');
          return { success: false, message: data.message || '同步失败：请求过于频繁，请稍后再试' };
        } else {
          addLog('error', data.message || '同步失败');
          return { success: false, message: data.message || '同步失败' };
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          if (retryCount < maxRetries) {
            retryCount++;
            addLog('error', `请求超时，${retryCount}秒后重试...`);
            messageApi.warning(`请求超时，${retryCount}秒后重试...`, 3);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return attemptSync();
          }
          addLog('error', '同步失败：请求超时，请稍后再试');
          return { success: false, message: '同步失败：请求超时，请稍后再试' };
        }
        if (retryCount < maxRetries) {
          retryCount++;
          addLog('error', `网络错误，${retryCount}秒后重试...`);
          messageApi.warning(`网络错误，${retryCount}秒后重试...`, 3);
          await new Promise(resolve => setTimeout(resolve, 3000));
          return attemptSync();
        }
        addLog('error', error.message || '同步失败：网络错误');
        return { success: false, message: error.message || '同步失败：网络错误' };
      }
    };
    
    try {
      const result = await attemptSync();
      setSyncLoading(false);
      
      if (result.success) {
        messageApi.success(result.message);
        loadKeywords();
        loadStats();
        
        setSyncProgress(prev => ({
          ...prev,
          isRunning: false,
        }));
      } else {
        messageApi.error(result.message);
        
        setSyncProgress(prev => ({
          ...prev,
          isRunning: false,
        }));
      }
    } catch (error: any) {
      setSyncLoading(false);
      addLog('error', error.message || '同步失败');
      messageApi.error(error.message || '同步失败');
      
      setSyncProgress(prev => ({
        ...prev,
        isRunning: false,
      }));
    }
  };

  const handleSyncAllKeywords = async () => {
    setSyncLoading(true);
    setShowProgressPanel(true);
    setSyncProgress({
      isRunning: true,
      currentKeyword: '准备中...',
      currentIndex: 0,
      totalKeywords: 0,
      syncedVideos: 0,
      errors: 0,
      stages: [],
      logs: [{ time: dayjs().format('HH:mm:ss'), type: 'info', message: '正在启动全量视频同步任务...' }],
    });

    let retryCount = 0;
    const maxRetries = 2;
    
    const attemptSync = async (): Promise<{ success: boolean; message: string }> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);
        
        const response = await fetch('http://localhost:3001/api/admin/sync/videos-by-keywords', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          },
          body: JSON.stringify({
            days: 30,
            maxResultsPerKeyword: 50,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (data.code === 0) {
          addLog('success', `成功从 ${data.data.keywords} 个关键词同步 ${data.data.synced} 个视频`);
          return { success: true, message: `成功从 ${data.data.keywords} 个关键词同步 ${data.data.synced} 个视频` };
        } else if (data.code === 429 || data.message?.includes('限流') || data.message?.includes('too many requests')) {
          if (retryCount < maxRetries) {
            retryCount++;
            addLog('error', `请求受限，${retryCount * 3}秒后重试...`);
            messageApi.warning(`请求受限，${retryCount * 3}秒后重试...`, 3);
            await new Promise(resolve => setTimeout(resolve, retryCount * 3000));
            return attemptSync();
          }
          addLog('error', data.message || '同步失败：请求过于频繁，请稍后再试');
          return { success: false, message: data.message || '同步失败：请求过于频繁，请稍后再试' };
        } else {
          addLog('error', data.message || '同步失败');
          return { success: false, message: data.message || '同步失败' };
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          if (retryCount < maxRetries) {
            retryCount++;
            addLog('error', `请求超时，${retryCount * 3}秒后重试...`);
            messageApi.warning(`请求超时，${retryCount * 3}秒后重试...`, 3);
            await new Promise(resolve => setTimeout(resolve, retryCount * 3000));
            return attemptSync();
          }
          addLog('error', '同步失败：请求超时，请稍后再试');
          return { success: false, message: '同步失败：请求超时，请稍后再试' };
        }
        if (retryCount < maxRetries) {
          retryCount++;
          addLog('error', `网络错误，${retryCount * 3}秒后重试...`);
          messageApi.warning(`网络错误，${retryCount * 3}秒后重试...`, 3);
          await new Promise(resolve => setTimeout(resolve, retryCount * 3000));
          return attemptSync();
        }
        addLog('error', error.message || '同步失败：网络错误');
        return { success: false, message: error.message || '同步失败：网络错误' };
      }
    };
    
    const hideLoading = messageApi.loading('正在根据所有启用的关键词搜索视频，这可能需要一些时间...', 0);
    
    try {
      const result = await attemptSync();
      hideLoading();
      setSyncLoading(false);
      
      if (result.success) {
        messageApi.success(result.message);
        loadKeywords();
        loadStats();
        
        setSyncProgress(prev => ({
          ...prev,
          isRunning: false,
        }));
      } else {
        messageApi.error(result.message);
        
        setSyncProgress(prev => ({
          ...prev,
          isRunning: false,
        }));
      }
    } catch (error: any) {
      hideLoading();
      setSyncLoading(false);
      console.error('Sync all keywords error:', error);
      addLog('error', error.message || '同步失败');
      messageApi.error(error.message || '同步失败');
      
      setSyncProgress(prev => ({
        ...prev,
        isRunning: false,
      }));
    }
  };

  const handleEnableAllKeywords = async () => {
    try {
      const inactiveKeywords = keywords.filter(k => !k.isActive);
      
      if (inactiveKeywords.length === 0) {
        messageApi.info('所有关键词已启用');
        return;
      }
      
      const hideLoading = messageApi.loading(`正在启用 ${inactiveKeywords.length} 个关键词...`, 0);
      
      for (const keyword of inactiveKeywords) {
        await bilibiliSearchKeywordApi.updateKeyword(keyword.id, {
          isActive: true,
        });
      }
      
      hideLoading();
      messageApi.success(`成功启用 ${inactiveKeywords.length} 个关键词`);
      loadKeywords();
      loadStats();
    } catch (error: any) {
      console.error('Enable all keywords error:', error);
      messageApi.error(error.message || '启用失败');
    }
  };

  const handleDisableAllKeywords = async () => {
    try {
      const activeKeywords = keywords.filter(k => k.isActive);
      
      if (activeKeywords.length === 0) {
        messageApi.info('所有关键词已禁用');
        return;
      }
      
      const hideLoading = messageApi.loading(`正在禁用 ${activeKeywords.length} 个关键词...`, 0);
      
      for (const keyword of activeKeywords) {
        await bilibiliSearchKeywordApi.updateKeyword(keyword.id, {
          isActive: false,
        });
      }
      
      hideLoading();
      messageApi.success(`成功禁用 ${activeKeywords.length} 个关键词`);
      loadKeywords();
      loadStats();
    } catch (error: any) {
      console.error('Disable all keywords error:', error);
      messageApi.error(error.message || '禁用失败');
    }
  };

  const handleManualCookieSubmit = async (values: { name: string; cookie: string }) => {
    try {
      await cookieApi.addCookie(values.name, values.cookie);
      messageApi.success('Cookie添加成功');
      setManualCookieModalVisible(false);
      cookieForm.resetFields();
      loadCookieStatus();
    } catch (error: any) {
      console.error('Add cookie error:', error);
      messageApi.error(error.response?.data?.message || error.message || '添加失败');
    }
  };

  const handleCaptureCookie = async () => {
    const confirmed = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: '自动捕获Cookie（开发中）',
        icon: <ChromeOutlined />,
        content: (
          <div>
            <p>自动捕获功能正在开发中，敬请期待！</p>
            <p style={{ color: '#666', fontSize: 13, marginTop: 8 }}>
              目前请使用「手动输入」功能添加Cookie。
            </p>
          </div>
        ),
        okText: '使用手动输入',
        cancelText: '关闭',
        onOk: () => {
          resolve(true);
          setManualCookieModalVisible(true);
        },
        onCancel: () => resolve(false),
      });
    });

    if (confirmed) {
      setManualCookieModalVisible(true);
    }
  };

  const getCookieHealthStatus = () => {
    if (!cookieStatus || cookieStatus.totalCount === 0) {
      return { status: 'error', text: '未配置', icon: <CloseCircleFilled /> };
    }
    
    if (cookieStatus.activeCount === 0) {
      return { status: 'error', text: '全部失效', icon: <CloseCircleFilled /> };
    }
    
    const hasError = cookieStatus.cookies?.some(c => c.errorCount >= 3);
    if (hasError) {
      return { status: 'warning', text: '部分失效', icon: <WarningFilled /> };
    }
    
    const hasWarning = cookieStatus.cookies?.some(c => c.errorCount > 0);
    if (hasWarning) {
      return { status: 'warning', text: '不稳定', icon: <WarningFilled /> };
    }
    
    return { status: 'normal', text: '健康', icon: <CheckCircleFilled /> };
  };

  const handleAdd = () => {
    setEditingKeyword(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      priority: 0,
    });
    setModalVisible(true);
  };

  const tagStyle = { fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 500 } as const;

  const columns = [
    {
      title: '关键词',
      dataIndex: 'keyword',
      key: 'keyword',
      width: 140,
      fixed: 'left' as const,
      render: (text: string, record: BilibiliSearchKeyword) => (
        <Space size={6}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{text}</span>
          {record.priority > 0 && (
            <Tooltip title={`优先级: ${record.priority}`}>
              <Tag color="orange" style={tagStyle}>P{record.priority}</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        category ? (
          <Tag color="blue" style={tagStyle}>{category}</Tag>
        ) : (
          <span style={{ color: '#9ca3af', fontSize: 14 }}>—</span>
        )
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      sorter: (a: BilibiliSearchKeyword, b: BilibiliSearchKeyword) => a.priority - b.priority,
      render: (priority: number) => (
        <Tag color={priority > 0 ? 'orange' : 'default'} style={tagStyle}>{priority}</Tag>
      ),
    },
    {
      title: '视频数',
      dataIndex: 'videoCount',
      key: 'videoCount',
      width: 84,
      sorter: (a: any, b: any) => (a.videoCount || 0) - (b.videoCount || 0),
      render: (count: number) => (
        <Tag color={(count || 0) > 0 ? 'green' : 'default'} style={tagStyle}>{count || 0}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      filters: [
        { text: '启用', value: true },
        { text: '禁用', value: false },
      ],
      render: (isActive: boolean, record: BilibiliSearchKeyword) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleStatus(record.id, isActive)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          size="small"
        />
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 160,
      ellipsis: true,
      render: (description: string) => (
        <Tooltip title={description || '—'}>
          <span style={{ color: '#6b7280', fontSize: 14 }}>{description || '—'}</span>
        </Tooltip>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a: BilibiliSearchKeyword, b: BilibiliSearchKeyword) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
          <span style={{ fontSize: 14 }}>{dayjs(date).format('MM-DD HH:mm')}</span>
        </Tooltip>
      ),
    },
    {
      title: '最近同步',
      dataIndex: 'lastSyncedAt',
      key: 'lastSyncedAt',
      width: 120,
      sorter: (a: BilibiliSearchKeyword, b: BilibiliSearchKeyword) => {
        const aTime = a.lastSyncedAt ? new Date(a.lastSyncedAt).getTime() : 0;
        const bTime = b.lastSyncedAt ? new Date(b.lastSyncedAt).getTime() : 0;
        return aTime - bTime;
      },
      render: (date: string | undefined) => (
        date ? (
          <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
            <span style={{ fontSize: 14, color: date ? '#52c41a' : undefined }}>
              {dayjs(date).format('MM-DD HH:mm')}
            </span>
          </Tooltip>
        ) : (
          <span style={{ fontSize: 14, color: '#9ca3af' }}>从未同步</span>
        )
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: BilibiliSearchKeyword) => (
        <Space size={6}>
          <Tooltip title="查看相关视频">
            <Button
              type="text"
              size="middle"
              icon={<VideoCameraOutlined />}
              onClick={() => loadVideosForKeyword(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="middle"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除？"
            description="删除后不会影响已抓取的视频"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" size="middle" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const cookieHealth = getCookieHealthStatus();
  const progressPercent = syncProgress.totalKeywords > 0 
    ? Math.round((syncProgress.currentIndex / syncProgress.totalKeywords) * 100) 
    : 0;

  return (
    <div className={styles.pageWrapper}>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>B站搜索词管理</h1>
            <div className={styles.filterRow}>
              <Input.Search
                placeholder="搜索关键词..."
                style={{ width: 240 }}
                size="middle"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onSearch={() => setPage(1)}
                enterButton={<SearchOutlined />}
                allowClear
              />
              <Select
                placeholder="分类筛选"
                style={{ width: 140 }}
                size="middle"
                value={categoryFilter || undefined}
                onChange={(value) => {
                  setCategoryFilter(value);
                  setPage(1);
                }}
                allowClear
              >
                {CATEGORIES.map(cat => (
                  <Select.Option key={cat.value} value={cat.value}>{cat.label}</Select.Option>
                ))}
              </Select>
              <Select
                placeholder="状态"
                style={{ width: 110 }}
                size="middle"
                value={statusFilter === undefined ? undefined : statusFilter ? 'true' : 'false'}
                onChange={(value) => {
                  setStatusFilter(value === undefined ? undefined : value === 'true');
                  setPage(1);
                }}
                allowClear
              >
                <Select.Option value="true">启用</Select.Option>
                <Select.Option value="false">禁用</Select.Option>
              </Select>
              <Button icon={<ReloadOutlined />} onClick={() => { loadKeywords(); loadStats(); }} size="middle">
                刷新
              </Button>
            </div>
          </div>

          <div className={styles.cookieStatusBar}>
            <div className={styles.cookieStatusLeft}>
              <div className={styles.cookieStatusItem}>
                <ChromeOutlined style={{ fontSize: 18 }} />
                <span className={styles.cookieStatusLabel}>Cookie状态:</span>
                <Tag 
                  color={cookieHealth.status === 'normal' ? 'success' : cookieHealth.status === 'warning' ? 'warning' : 'error'}
                  icon={cookieLoading ? <LoadingOutlined /> : cookieHealth.icon}
                >
                  {cookieLoading ? '加载中...' : cookieHealth.text}
                </Tag>
              </div>
              <div className={styles.cookieStatusItem}>
                <span className={styles.cookieStatusLabel}>活跃:</span>
                <span className={styles.cookieStatusValue}>
                  {cookieStatus?.activeCount || 0} / {cookieStatus?.totalCount || 0}
                </span>
              </div>
              {cookieStatus?.cookies?.[0]?.lastUsed && (
                <div className={styles.cookieStatusItem}>
                  <span className={styles.cookieStatusLabel}>最后使用:</span>
                  <span className={styles.cookieStatusValue}>
                    {dayjs(cookieStatus.cookies[0].lastUsed).format('HH:mm:ss')}
                  </span>
                </div>
              )}
            </div>
            <div className={styles.cookieStatusRight}>
              <Button 
                size="small" 
                icon={<ReloadOutlined />} 
                onClick={loadCookieStatus}
                loading={cookieLoading}
              >
                刷新
              </Button>
              <Button 
                size="small" 
                icon={<ChromeOutlined />} 
                onClick={handleCaptureCookie}
              >
                自动捕获
              </Button>
              <Button 
                size="small" 
                icon={<PlusOutlined />} 
                onClick={() => setManualCookieModalVisible(true)}
              >
                手动输入
              </Button>
            </div>
          </div>

          {showProgressPanel && (
            <div className={styles.progressPanel}>
              <div className={styles.progressPanelHeader}>
                <div className={styles.progressTitle}>
                  <VideoCameraOutlined />
                  <span>视频抓取进度</span>
                  {syncLoading && <LoadingOutlined spin />}
                </div>
                <Button size="small" onClick={() => setShowProgressPanel(false)}>
                  {syncProgress.isRunning ? '隐藏' : '关闭'}
                </Button>
              </div>
              <div className={styles.progressBody}>
                <div className={styles.progressInfo}>
                  <div className={styles.progressInfoLeft}>
                    <span className={styles.progressStage}>
                      状态: {syncProgress.isRunning ? '进行中' : '已完成'}
                    </span>
                    <span className={styles.progressPercent}>
                      {progressPercent}%
                    </span>
                    <span className={styles.progressCurrentKeyword}>
                      {syncProgress.currentKeyword}
                    </span>
                  </div>
                  <div>
                    {syncProgress.currentIndex} / {syncProgress.totalKeywords || stats?.active || 0} 个关键词
                  </div>
                </div>
                
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressBarInner} 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className={styles.resultSummary}>
                  <div className={`${styles.resultItem} ${styles.resultSuccess}`}>
                    <CheckCircleOutlined />
                    <span>成功: {syncProgress.syncedVideos} 个视频</span>
                  </div>
                  <div className={`${styles.resultItem} ${styles.resultError}`}>
                    <CloseCircleOutlined />
                    <span>失败: {syncProgress.errors} 个</span>
                  </div>
                </div>

                <div className={styles.logSection}>
                  <div className={styles.logTitle}>操作日志</div>
                  <div className={styles.logList}>
                    {syncProgress.logs.slice(0, 20).map((log, index) => (
                      <div 
                        key={index} 
                        className={`${styles.logItem} ${
                          log.type === 'success' ? styles.logItemSuccess : 
                          log.type === 'error' ? styles.logItemError : 
                          styles.logItemInfo
                        }`}
                      >
                        [{log.time}] {log.message}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={styles.actionRow}>
            <Space size="middle" wrap>
              <Button
                type="default"
                icon={<CheckCircleOutlined />}
                onClick={handleEnableAllKeywords}
                size="middle"
              >
                启用全部
              </Button>
              <Button
                type="default"
                icon={<CloseCircleOutlined />}
                onClick={handleDisableAllKeywords}
                size="middle"
              >
                禁用全部
              </Button>
              <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)} size="middle">
                导入
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                loading={exportLoading}
                size="middle"
              >
                导出
              </Button>
            </Space>
            <Space size="middle">
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleSyncAllKeywords}
                loading={syncLoading}
                size="middle"
              >
                一键抓取视频
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="middle">
                新增关键词
              </Button>
            </Space>
          </div>

          <Row gutter={[16, 16]} className={styles.statsRow}>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card size="small" className={styles.statCard}>
                <Statistic
                  title="总关键词数"
                  value={stats?.total || total}
                  prefix={<InfoCircleOutlined />}
                  valueStyle={{ color: '#1890ff', fontSize: 22 }}
                  suffix={<span style={{ fontSize: 13, color: '#9ca3af' }}>个</span>}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card size="small" className={styles.statCard}>
                <Statistic
                  title="启用关键词"
                  value={stats?.active || keywords.filter(k => k.isActive).length}
                  valueStyle={{ color: '#52c41a', fontSize: 22 }}
                  suffix={<span style={{ fontSize: 13, color: '#9ca3af' }}>个</span>}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card size="small" className={styles.statCard}>
                <Statistic
                  title="禁用关键词"
                  value={stats?.inactive || keywords.filter(k => !k.isActive).length}
                  valueStyle={{ color: '#ef4444', fontSize: 22 }}
                  suffix={<span style={{ fontSize: 13, color: '#9ca3af' }}>个</span>}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6} lg={6} xl={6}>
              <Card size="small" className={styles.statCard}>
                <Statistic
                  title="关联视频"
                  value={stats?.totalVideos || keywords.reduce((sum, k) => sum + (k.videoCount || 0), 0)}
                  prefix={<VideoCameraOutlined />}
                  valueStyle={{ color: '#7c3aed', fontSize: 22 }}
                  suffix={<span style={{ fontSize: 13, color: '#9ca3af' }}>个</span>}
                />
              </Card>
            </Col>
          </Row>

          <div className={styles.tableWrap}>
            <Table
              columns={columns}
              dataSource={keywords}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1100 }}
              locale={{ emptyText: total === 0 && !loading ? '暂无关键词，请先运行初始化脚本或点击「新增关键词」' : undefined }}
              pagination={{
                current: page,
                pageSize: pageSize,
                total: total,
                onChange: (p, s) => {
                  setPage(p);
                  setPageSize(s || 50);
                },
                showTotal: (t) => `共 ${t} 条`,
                showSizeChanger: true,
                pageSizeOptions: ['20', '50', '100', '200'],
              }}
              size="middle"
            />
          </div>

      <Modal
        title={editingKeyword ? '编辑关键词' : '新增关键词'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingKeyword(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingKeyword ? handleUpdate : handleCreate}
        >
          <Form.Item
            name="keyword"
            label="关键词"
            rules={[{ required: true, message: '请输入关键词' }]}
          >
            <Input placeholder="例如：具身智能" />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
          >
            <Select placeholder="选择分类" allowClear>
              {CATEGORIES.map(cat => (
                <Select.Option key={cat.value} value={cat.value}>{cat.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            tooltip="数值越大，优先级越高"
          >
            <InputNumber min={0} max={100} placeholder="0-100" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="关键词的描述信息" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingKeyword(null);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingKeyword ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量导入关键词"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          setImportFileList([]);
        }}
        footer={null}
        width={600}
      >
        <Alert
          message="导入说明"
          description={
            <div>
              <p>• CSV文件必须包含以下列：keyword, category, priority, isActive, description</p>
              <p>• keyword列为必填项，其他列为可选项</p>
              <p>• isActive列的值应为"启用"或"禁用"</p>
              <p>• priority列的值应为数字（0-100）</p>
            </div>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />
        <Upload.Dragger
          fileList={importFileList}
          beforeUpload={(file) => {
            handleImport(file);
            return false;
          }}
          onRemove={() => setImportFileList([])}
          accept=".csv"
          maxCount={1}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽CSV文件到此区域上传</p>
          <p className="ant-upload-hint">支持单个CSV文件上传</p>
        </Upload.Dragger>
      </Modal>

      <Modal
        title="手动输入Cookie"
        open={manualCookieModalVisible}
        onCancel={() => {
          setManualCookieModalVisible(false);
          cookieForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Alert
          message="获取Cookie步骤"
          description={
            <div>
              <ol style={{ marginTop: 8, paddingLeft: 20 }}>
                <li>打开浏览器，登录 <a href="https://www.bilibili.com" target="_blank" rel="noopener noreferrer">bilibili.com</a></li>
                <li>按 <kbd>F12</kbd> 打开开发者工具</li>
                <li>切换到 <strong>Network</strong> 标签页</li>
                <li>刷新页面，点击任意请求</li>
                <li>在 <strong>Headers</strong> 中找到 <code>Cookie</code>，复制整个值</li>
              </ol>
            </div>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />
        <Form form={cookieForm} layout="vertical" onFinish={handleManualCookieSubmit}>
          <Form.Item
            name="name"
            label="Cookie名称"
            rules={[{ required: true, message: '请输入Cookie名称' }]}
          >
            <Input placeholder="例如：主账号Cookie" />
          </Form.Item>
          <Form.Item
            name="cookie"
            label="Cookie内容"
            rules={[{ required: true, message: '请输入Cookie内容' }]}
          >
            <TextArea
              placeholder="粘贴完整的Cookie字符串"
              rows={6}
              className={styles.cookieInputArea}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setManualCookieModalVisible(false);
                cookieForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <VideoCameraOutlined />
            <span>关键词相关视频</span>
            {selectedKeyword && (
              <Tag color="blue">{selectedKeyword.keyword}</Tag>
            )}
          </Space>
        }
        open={videosModalVisible}
        onCancel={() => {
          setVideosModalVisible(false);
          setSelectedKeyword(null);
          setVideos([]);
        }}
        footer={null}
        width={1000}
      >
        {videosLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Button type="primary" loading>加载中...</Button>
          </div>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <VideoCameraOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <Paragraph type="secondary">暂无相关视频</Paragraph>
            <Text type="secondary">该关键词尚未抓取到相关视频内容</Text>
          </div>
        ) : (
          <List
            dataSource={videos}
            renderItem={(video: any) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={getProxyImageUrl(video.coverUrl || video.thumbnailUrl)}
                      shape="square"
                      size={64}
                      icon={<VideoCameraOutlined />}
                    />
                  }
                  title={
                    <a
                      href={video.videoUrl || `https://www.bilibili.com/video/${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {video.title}
                    </a>
                  }
                  description={
                    <Space split={<Divider type="vertical" />}>
                      <Text type="secondary">
                        {video.uploader || video.author}
                      </Text>
                      <Text type="secondary">
                        {dayjs(video.publishedDate || video.createdAt).format('YYYY-MM-DD')}
                      </Text>
                      <Text type="secondary">
                        {video.playCount || video.viewCount || 0} 播放
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 个视频`,
            }}
          />
        )}
      </Modal>
        </Space>
      </Card>
    </div>
  );
}
