/**
 * 管理端 - 首页运营模块管理页面（优化版）
 * 优化：可视化配置、实时预览、拖拽排序、批量操作
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, Form, Input, Select, DatePicker, 
  Switch, Tag, Card, Row, Col, Divider, Tooltip, Popconfirm, Badge,
  Tabs, InputNumber, Radio, Collapse, Alert, App
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, 
  CopyOutlined, UpOutlined, DownOutlined, QuestionCircleOutlined,
  DragOutlined, CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import { homeModuleApi } from '@/lib/api/home-module';
import { HomeModule } from '@/lib/api/types';
import dayjs, { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import styles from './page.module.css';

const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

// 模块类型配置
const MODULE_TYPE_CONFIG = {
  banner: {
    label: 'Banner',
    icon: '🖼️',
    description: '轮播图展示，支持图片和链接',
    fields: ['imageUrl', 'linkUrl', 'title', 'description']
  },
  announcement: {
    label: '公告',
    icon: '📢',
    description: '系统公告，支持链接跳转',
    fields: ['title', 'content', 'type', 'linkUrl']
  },
  promotion: {
    label: '推广',
    icon: '🎯',
    description: '推广活动，支持自定义样式',
    fields: ['title', 'content', 'linkUrl', 'buttonText']
  },
  custom: {
    label: '自定义',
    icon: '⚙️',
    description: '完全自定义的HTML模块',
    fields: ['html', 'css', 'js']
  }
};

// 模块模板配置
const MODULE_TEMPLATES = [
  {
    id: 'promotion_community',
    name: '市集推广模板',
    type: 'promotion',
    position: 'bottom',
    title: '加入具身智能市集',
    description: '市集推广卡片',
    content: 'Embodied Pulse 是专为具身智能领域打造的信息聚合平台。我们聚合了最新的论文、代码、模型、视频和求职信息，帮助您快速发现和获取具身智能领域的最新资源。与全球具身智能研究者、工程师和爱好者一起探索AI的未来。',
    linkUrl: '/community',
    buttonText: '立即加入市集 →',
    gradient: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    textColor: '#fff',
  },
  {
    id: 'announcement_maintenance',
    name: '系统维护通知模板',
    type: 'announcement',
    position: 'top',
    title: '系统维护通知',
    description: '系统维护公告',
    content: '系统将于今晚22:00-24:00进行维护升级，期间可能无法访问，请提前保存数据。维护完成后将带来更快的响应速度和更稳定的服务体验。',
    announcementType: 'warning',
    linkUrl: '/announcements/maintenance',
  },
  {
    id: 'announcement_new_feature',
    name: '新功能上线模板',
    type: 'announcement',
    position: 'top',
    title: '新功能上线：智能推荐算法升级',
    description: '新功能上线公告',
    content: '我们升级了推荐算法，现在可以为您推荐更精准的内容！基于您的浏览历史、收藏偏好和市集互动，系统会智能匹配最适合您的内容。快去体验一下吧！',
    announcementType: 'info',
    linkUrl: '/features/recommendation',
  },
  {
    id: 'promotion_new_features',
    name: '新功能推广模板',
    type: 'promotion',
    position: 'bottom',
    title: '新功能上线',
    description: '新功能推广',
    content: '智能推荐算法已升级，现在可以为您推荐更精准的内容！基于您的浏览历史、收藏偏好和市集互动，系统会智能匹配最适合您的内容。',
    linkUrl: '/features',
    buttonText: '立即体验 →',
    backgroundColor: '#f0f9ff',
    textColor: '#1e40af',
  },
  {
    id: 'promotion_event',
    name: '活动推广模板',
    type: 'promotion',
    position: 'bottom',
    title: '2026具身智能春季学术会议',
    description: '学术会议活动推广',
    content: '汇聚全球顶尖研究者，探讨具身智能最新进展。会议将涵盖机器人学习、计算机视觉、自然语言处理等多个领域，欢迎报名参加。',
    linkUrl: '/events/spring-conference-2026',
    buttonText: '立即报名 →',
    gradient: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
    textColor: '#fff',
  },
  {
    id: 'banner_event',
    name: '活动Banner模板',
    type: 'banner',
    position: 'top',
    title: '2026具身智能春季学术会议',
    description: '学术会议Banner',
    imageUrl: 'https://via.placeholder.com/1200x300/667eea/ffffff?text=2026%E5%85%B7%E8%BA%AB%E6%99%BA%E8%83%BD%E6%98%A5%E5%AD%A3%E5%AD%A6%E6%9C%AF%E4%BC%9A%E8%AE%AE',
    linkUrl: '/events/spring-conference-2026',
  },
];

export default function AdminHomeModulesPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<HomeModule[]>([]);
  const [filteredModules, setFilteredModules] = useState<HomeModule[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingModule, setEditingModule] = useState<HomeModule | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    filterModules();
  }, [modules, searchText, statusFilter, typeFilter]);

  const loadModules = async () => {
    setLoading(true);
    try {
      const data = await homeModuleApi.getAllHomeModules();
      setModules(data);
    } catch (error: unknown) {
      console.error('Load modules error:', error);
      handleError(error, '加载失败');
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const filterModules = () => {
    let filtered = [...modules];

    // 搜索过滤
    if (searchText) {
      filtered = filtered.filter(m => 
        m.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        m.name?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(m => 
        statusFilter === 'active' ? m.isActive : !m.isActive
      );
    }

    // 类型过滤
    if (typeFilter !== 'all') {
      // 注意：当前schema中可能没有moduleType字段，需要根据实际调整
      // filtered = filtered.filter(m => m.moduleType === typeFilter);
    }

    setFilteredModules(filtered);
  };

  type ApiError = { status?: number; code?: string; message?: string; response?: { data?: { code?: number; message?: string } } };
  const normalizeError = (error: unknown): ApiError => (
    typeof error === 'object' && error !== null ? (error as ApiError) : {}
  );
  const handleError = (error: unknown, defaultMessage: string) => {
    const err = normalizeError(error);
    if (err.status === 401 || err.code === 'UNAUTHORIZED' || err.response?.data?.code === 1002 || err.response?.data?.code === 1003) {
      message.error('未登录或登录已过期，请重新登录');
    } else if (err.code === 'CONNECTION_REFUSED' || err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') {
      message.error('后端服务未运行，请确保后端服务已启动');
    } else {
      let errorMessage = err.message || err.response?.data?.message || defaultMessage;
      
      // 处理特定的错误代码
      if (errorMessage.includes('HOME_MODULE_UPDATE_FAILED')) {
        if (errorMessage.includes('HOME_MODULE_NOT_FOUND')) {
          errorMessage = '模块不存在，可能已被删除';
        } else if (errorMessage.includes('HOME_MODULE_NAME_EXISTS')) {
          errorMessage = '模块标识已存在，请使用其他标识';
        } else {
          errorMessage = '更新失败：' + (errorMessage.split(':')[1] || '未知错误');
        }
      } else if (errorMessage.includes('HOME_MODULE_CREATION_FAILED')) {
        if (errorMessage.includes('HOME_MODULE_NAME_EXISTS')) {
          errorMessage = '模块标识已存在，请使用其他标识';
        } else {
          errorMessage = '创建失败：' + (errorMessage.split(':')[1] || '未知错误');
        }
      }
      
      message.error(errorMessage);
      console.error('Operation error:', error);
    }
  };

  const handleCreate = () => {
    setEditingModule(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      order: 0,
      position: 'top',
      moduleType: 'promotion', // 默认选择推广类型，最常用
    });
    // 显示模板选择弹窗
    setShowTemplateModal(true);
  };

  const handleUseTemplate = (template: typeof MODULE_TEMPLATES[0]) => {
    setShowTemplateModal(false);
    form.resetFields();
    
    // 生成唯一的模块标识
    const moduleName = `${template.type}_${template.id}_${Date.now()}`;
    
    // 填充模板数据
    form.setFieldsValue({
      name: moduleName,
      title: template.title,
      description: template.description,
      moduleType: template.type,
      position: template.position,
      isActive: true,
      order: 0,
      // 推广类型字段
      content: template.content || '',
      linkUrl: template.linkUrl || '',
      buttonText: template.buttonText || '',
      gradient: template.gradient || '',
      backgroundColor: template.backgroundColor || '',
      textColor: template.textColor || '#333',
      // Banner类型字段
      imageUrl: template.imageUrl || '',
      // 公告类型字段
      announcementType: template.announcementType || 'info',
    });
    
    // 更新config
    updateConfigFromForm();
    
    // 打开编辑弹窗
    setShowModal(true);
    message.success(`已应用模板：${template.name}`);
  };

  const handleEdit = (module: HomeModule) => {
    setEditingModule(module);
    try {
      const config = module.config ? JSON.parse(module.config) : {};
      form.setFieldsValue({
        name: module.name,
        title: module.title,
        description: module.description,
        config: module.config,
        isActive: module.isActive,
        order: module.order ?? module.sortOrder ?? 0,
        position: config.position || 'top',
        moduleType: config.moduleType || 'custom',
        startDate: config.startDate ? dayjs(config.startDate) : null,
        endDate: config.endDate ? dayjs(config.endDate) : null,
        // 推广类型字段
        content: config.content || '',
        linkUrl: config.linkUrl || '',
        buttonText: config.buttonText || '',
        gradient: config.gradient || '',
        backgroundColor: config.backgroundColor || '',
        textColor: config.textColor || '#333',
        // Banner类型字段
        imageUrl: config.imageUrl || '',
        // 公告类型字段
        announcementType: config.type || 'info',
        // 自定义类型字段
        html: config.html || '',
        css: config.css || '',
        js: config.js || '',
      });
    } catch (e) {
      form.setFieldsValue({
        name: module.name,
        title: module.title,
        description: module.description,
        config: module.config,
        isActive: module.isActive,
        order: module.order ?? module.sortOrder ?? 0,
        position: 'top',
        moduleType: 'custom',
        startDate: null,
        endDate: null,
      });
    }
    setShowModal(true);
  };

  const handleCopy = async (module: HomeModule) => {
    try {
      const config = module.config ? JSON.parse(module.config) : {};
      const newData = {
        name: `${module.name}_copy_${Date.now()}`,
        title: `${module.title} (副本)`,
        description: module.description,
        config: module.config,
        isActive: false, // 复制的模块默认禁用
        order: (module.order ?? module.sortOrder ?? 0) + 1,
        ...config,
      };
      await homeModuleApi.createHomeModule(newData);
      message.success('复制成功');
      loadModules();
    } catch (error: unknown) {
      handleError(error, '复制失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await homeModuleApi.deleteHomeModule(id);
      message.success('删除成功');
      loadModules();
    } catch (error: unknown) {
      handleError(error, '删除失败');
    }
  };

  const handleToggleStatus = async (module: HomeModule) => {
    try {
      await homeModuleApi.updateHomeModule(module.id, {
        isActive: !module.isActive,
      });
      message.success(module.isActive ? '已禁用' : '已启用');
      loadModules();
    } catch (error: unknown) {
      handleError(error, '操作失败');
    }
  };

  const handleMoveOrder = async (module: HomeModule, direction: 'up' | 'down') => {
    const currentIndex = modules.findIndex(m => m.id === module.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;

    const targetModule = modules[targetIndex];
    const newOrder = targetModule.order ?? targetModule.sortOrder ?? 0;
    const oldOrder = module.order ?? module.sortOrder ?? 0;

    try {
      await Promise.all([
        homeModuleApi.updateHomeModule(module.id, { order: newOrder }),
        homeModuleApi.updateHomeModule(targetModule.id, { order: oldOrder }),
      ]);
      message.success('排序已更新');
      loadModules();
    } catch (error: unknown) {
      handleError(error, '排序更新失败');
    }
  };

  const handlePreview = () => {
    const values = form.getFieldsValue();
    const safeValues = JSON.parse(JSON.stringify(values, (key, value) => {
      if (key === 'config' && typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    }));
    setPreviewData(safeValues);
    setShowPreview(true);
  };

  // 更新config JSON的函数（提取到组件级别，供模板功能使用）
  const updateConfigFromForm = () => {
    const values = form.getFieldsValue();
    const currentConfig = values.config ? (typeof values.config === 'string' ? JSON.parse(values.config) : values.config) : {};
    
    // 合并表单字段到config
    const newConfig = {
      ...currentConfig,
      position: values.position || currentConfig.position || 'top',
      moduleType: values.moduleType || currentConfig.moduleType || 'custom',
    };

    // 根据模块类型添加特定字段
    if (values.moduleType === 'promotion') {
      newConfig.content = values.content || currentConfig.content || '';
      newConfig.linkUrl = values.linkUrl || currentConfig.linkUrl || '';
      newConfig.buttonText = values.buttonText || currentConfig.buttonText || '';
      newConfig.gradient = values.gradient || currentConfig.gradient || '';
      newConfig.backgroundColor = values.backgroundColor || currentConfig.backgroundColor || '';
      newConfig.textColor = values.textColor || currentConfig.textColor || '#333';
    } else if (values.moduleType === 'banner') {
      newConfig.imageUrl = values.imageUrl || currentConfig.imageUrl || '';
      newConfig.linkUrl = values.linkUrl || currentConfig.linkUrl || '';
    } else if (values.moduleType === 'announcement') {
      newConfig.content = values.content || currentConfig.content || '';
      newConfig.type = values.announcementType || currentConfig.type || 'info';
      newConfig.linkUrl = values.linkUrl || currentConfig.linkUrl || '';
    } else if (values.moduleType === 'custom') {
      newConfig.html = values.html || currentConfig.html || '';
      newConfig.css = values.css || currentConfig.css || '';
      newConfig.js = values.js || currentConfig.js || '';
    }

    // 更新config字段
    form.setFieldValue('config', JSON.stringify(newConfig, null, 2));
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      // 提取config字段和其他字段
      // 注意：只保留数据库模型中存在的字段（name, title, description, config, isActive, order）
      const { 
        config, 
        startDate, 
        endDate, 
        position,
        moduleType,
        content,
        linkUrl,
        buttonText,
        gradient,
        backgroundColor,
        textColor,
        imageUrl,
        announcementType,
        html,
        css,
        js,
        ...otherFields 
      } = values;
      
      // 如果config是字符串，尝试解析
      let configObj: Record<string, unknown> = {};
      if (config) {
        try {
          configObj = typeof config === 'string' ? JSON.parse(config) : (config as Record<string, unknown>);
        } catch {
          message.error('配置JSON格式错误');
          return;
        }
      }

      // 将定时时间添加到config中
      if (startDate) {
        configObj.startDate = dayjs(startDate as Dayjs).toISOString();
      }
      if (endDate) {
        configObj.endDate = dayjs(endDate as Dayjs).toISOString();
      }

      // 确保config中包含position和moduleType
      if (position) {
        configObj.position = position;
      }
      if (moduleType) {
        configObj.moduleType = moduleType;
      }

      // 只保留数据库模型中存在的字段
      const data: { name?: string; title?: string; description?: string; config: string; isActive: boolean; order: number } = {
        name: otherFields.name as string | undefined,
        title: otherFields.title as string | undefined,
        description: otherFields.description as string | undefined,
        config: JSON.stringify(configObj),
        isActive: otherFields.isActive !== undefined ? Boolean(otherFields.isActive) : true,
        order: otherFields.order !== undefined ? Number(otherFields.order) : 0,
      };

      // 验证必填字段
      if (!data.name) {
        message.error('模块标识不能为空');
        return;
      }
      if (!data.title) {
        message.error('标题不能为空');
        return;
      }

      if (editingModule) {
        await homeModuleApi.updateHomeModule(editingModule.id, data);
        message.success('更新成功');
      } else {
        await homeModuleApi.createHomeModule(data);
        message.success('创建成功');
      }
      setShowModal(false);
      loadModules();
    } catch (error: unknown) {
      console.error('Submit error:', error);
      handleError(error, '操作失败');
    }
  };

  const renderConfigForm = () => {
    const moduleType = form.getFieldValue('moduleType') || 'custom';
    const config = MODULE_TYPE_CONFIG[moduleType as keyof typeof MODULE_TYPE_CONFIG];

    if (!config) {
      return (
        <Form.Item 
          name="config" 
          label={
            <Space>
              <span>配置内容（JSON格式）</span>
              <Tooltip title="请输入有效的JSON格式配置">
                <QuestionCircleOutlined style={{ color: '#999' }} />
              </Tooltip>
            </Space>
          }
          rules={[
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                try {
                  JSON.parse(value);
                  return Promise.resolve();
                } catch (e) {
                  return Promise.reject(new Error('请输入有效的JSON格式'));
                }
              },
            },
          ]}
        >
          <TextArea 
            rows={8} 
            placeholder='{"key": "value"}'
            style={{ fontFamily: 'monospace' }}
          />
        </Form.Item>
      );
    }

    return (
      <Collapse defaultActiveKey={['basic', 'position', 'style']}>
        <Panel header="基础配置" key="basic">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="模块标题" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="模块描述（可选）" />
          </Form.Item>
          <Form.Item 
            name="moduleType" 
            label="模块类型" 
            rules={[{ required: true, message: '请选择模块类型' }]}
            tooltip="选择模块的展示类型"
          >
            <Select 
              placeholder="选择模块类型"
              onChange={(value) => {
                form.setFieldValue('moduleType', value);
                updateConfigFromForm();
              }}
            >
              <Option value="banner">🖼️ Banner（图片轮播）</Option>
              <Option value="announcement">📢 公告（系统通知）</Option>
              <Option value="promotion">🎯 推广（活动推广）</Option>
              <Option value="custom">⚙️ 自定义（HTML）</Option>
            </Select>
          </Form.Item>
        </Panel>

        <Panel header="位置和排序" key="position">
          <Form.Item 
            name="position" 
            label="显示位置" 
            tooltip="选择模块在首页的显示位置"
            rules={[{ required: true, message: '请选择显示位置' }]}
          >
            <Radio.Group 
              onChange={() => updateConfigFromForm()}
            >
              <Radio value="top">顶部（Banner下方）</Radio>
              <Radio value="bottom">底部（内容区域下方）</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="order" label="排序" tooltip="数字越小越靠前，相同位置按此值排序">
            <InputNumber 
              min={0} 
              style={{ width: '100%' }} 
              onChange={() => updateConfigFromForm()}
            />
          </Form.Item>
          <Form.Item name="isActive" label="是否启用" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Panel>

        {/* 根据模块类型显示不同的配置项 */}
        {moduleType === 'promotion' && (
          <Panel header="推广模块配置" key="promotion">
            <Form.Item 
              name="content" 
              label={
                <Space>
                  <span>推广内容</span>
                  <Tooltip title="输入推广活动的详细描述，建议50-200字，清晰说明活动亮点">
                    <QuestionCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                </Space>
              }
            >
              <TextArea 
                rows={4} 
                placeholder="例如：Embodied Pulse 是专为具身智能领域打造的信息聚合平台。我们聚合了最新的论文、代码、模型、视频和求职信息，帮助您快速发现和获取具身智能领域的最新资源。"
                onChange={() => updateConfigFromForm()}
                showCount
                maxLength={500}
              />
            </Form.Item>
            <Form.Item 
              name="linkUrl" 
              label={
                <Space>
                  <span>跳转链接（可选）</span>
                  <Tooltip title="用户点击按钮后跳转的链接，可以是站内链接（如 /community）或外部链接（如 https://example.com）">
                    <QuestionCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                </Space>
              }
            >
              <Input 
                placeholder="例如: /community 或 https://example.com"
                onChange={() => updateConfigFromForm()}
              />
            </Form.Item>
            <Form.Item 
              name="buttonText" 
              label={
                <Space>
                  <span>按钮文字（可选）</span>
                  <Tooltip title="按钮上显示的文字，如果不填写，将显示默认文字">
                    <QuestionCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                </Space>
              }
            >
              <Input 
                placeholder="例如: 立即加入 →"
                onChange={() => updateConfigFromForm()}
                maxLength={20}
              />
            </Form.Item>
          </Panel>
        )}

        {moduleType === 'banner' && (
          <Panel header="Banner模块配置" key="banner">
            <Alert
              message="图片要求"
              description="请使用清晰、高质量的图片，建议尺寸：1200x300像素，文件大小不超过2MB。支持JPG、PNG格式。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form.Item 
              name="imageUrl" 
              label={
                <Space>
                  <span>图片地址</span>
                  <Tooltip title="输入图片的完整URL地址，例如：https://example.com/image.jpg">
                    <QuestionCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                </Space>
              }
              rules={[{ required: true, message: '请输入图片地址' }]}
            >
              <Input 
                placeholder="例如：https://example.com/banner.jpg"
                onChange={() => updateConfigFromForm()}
              />
            </Form.Item>
            <Form.Item 
              name="linkUrl" 
              label={
                <Space>
                  <span>跳转链接（可选）</span>
                  <Tooltip title="用户点击Banner后跳转的链接，可以是站内链接（如 /community）或外部链接（如 https://example.com）">
                    <QuestionCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                </Space>
              }
            >
              <Input 
                placeholder="例如：/community 或 https://example.com"
                onChange={() => updateConfigFromForm()}
              />
            </Form.Item>
          </Panel>
        )}

        {moduleType === 'announcement' && (
          <Panel header="公告模块配置" key="announcement">
            <Form.Item name="content" label="公告内容">
              <TextArea 
                rows={4} 
                placeholder="输入公告内容"
                onChange={() => updateConfigFromForm()}
              />
            </Form.Item>
            <Form.Item name="announcementType" label="公告类型">
              <Select 
                placeholder="选择公告类型"
                onChange={() => updateConfigFromForm()}
              >
                <Option value="info">ℹ️ 信息（蓝色）</Option>
                <Option value="success">✅ 成功（绿色）</Option>
                <Option value="warning">⚠️ 警告（橙色）</Option>
                <Option value="error">❌ 错误（红色）</Option>
              </Select>
            </Form.Item>
            <Form.Item name="linkUrl" label="跳转链接">
              <Input 
                placeholder="点击公告跳转的链接（可选）"
                onChange={() => updateConfigFromForm()}
              />
            </Form.Item>
          </Panel>
        )}

        {moduleType === 'promotion' && (
          <Panel header="样式配置" key="style">
            <Alert
              message="背景样式"
              description="您可以选择渐变背景（推荐）或纯色背景。如果同时设置，渐变背景会优先显示。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Form.Item 
              name="gradient" 
              label={
                <Space>
                  <span>渐变背景</span>
                  <Tooltip title="选择预设的渐变样式，或手动输入渐变代码">
                    <QuestionCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                </Space>
              }
            >
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>快速选择：</div>
                  <Space wrap>
                    <Button 
                      size="small"
                      onClick={() => {
                        form.setFieldValue('gradient', 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)');
                        form.setFieldValue('textColor', '#fff');
                        form.setFieldValue('backgroundColor', '');
                        updateConfigFromForm();
                      }}
                      style={{ 
                        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                        border: 'none',
                        color: '#fff'
                      }}
                    >
                      蓝色渐变
                    </Button>
                    <Button 
                      size="small"
                      onClick={() => {
                        form.setFieldValue('gradient', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)');
                        form.setFieldValue('textColor', '#fff');
                        form.setFieldValue('backgroundColor', '');
                        updateConfigFromForm();
                      }}
                      style={{ 
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        border: 'none',
                        color: '#fff'
                      }}
                    >
                      蓝色渐变
                    </Button>
                    <Button 
                      size="small"
                      onClick={() => {
                        form.setFieldValue('gradient', 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)');
                        form.setFieldValue('textColor', '#fff');
                        form.setFieldValue('backgroundColor', '');
                        updateConfigFromForm();
                      }}
                      style={{ 
                        background: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
                        border: 'none',
                        color: '#fff'
                      }}
                    >
                      青色渐变
                    </Button>
                    <Button 
                      size="small"
                      onClick={() => {
                        form.setFieldValue('gradient', 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)');
                        form.setFieldValue('textColor', '#fff');
                        form.setFieldValue('backgroundColor', '');
                        updateConfigFromForm();
                      }}
                      style={{ 
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        border: 'none',
                        color: '#fff'
                      }}
                    >
                      绿色渐变
                    </Button>
                    <Button 
                      size="small"
                      onClick={() => {
                        form.setFieldValue('gradient', 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)');
                        form.setFieldValue('textColor', '#fff');
                        form.setFieldValue('backgroundColor', '');
                        updateConfigFromForm();
                      }}
                      style={{ 
                        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        border: 'none',
                        color: '#fff'
                      }}
                    >
                      橙色渐变
                    </Button>
                    <Button 
                      size="small"
                      onClick={() => {
                        form.setFieldValue('gradient', '');
                        updateConfigFromForm();
                      }}
                    >
                      清除渐变
                    </Button>
                  </Space>
                </div>
                <Input 
                  placeholder='或手动输入渐变代码（高级用户）'
                  onChange={() => updateConfigFromForm()}
                />
              </div>
            </Form.Item>
            
            <Divider style={{ margin: '16px 0' }}>或使用纯色背景</Divider>
            
            <Form.Item 
              name="backgroundColor" 
              label={
                <Space>
                  <span>纯色背景</span>
                  <Tooltip title="如果设置了渐变背景，纯色背景将被忽略">
                    <QuestionCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                </Space>
              }
            >
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>快速选择：</div>
                  <Space wrap>
                    {['#f0f9ff', '#fef3c7', '#fce7f3', '#e0e7ff', '#d1fae5', '#ffffff', '#f3f4f6'].map(color => (
                      <Button
                        key={color}
                        size="small"
                        onClick={() => {
                          form.setFieldValue('backgroundColor', color);
                          form.setFieldValue('gradient', '');
                          form.setFieldValue('textColor', color === '#ffffff' || color === '#f0f9ff' || color === '#fef3c7' || color === '#fce7f3' || color === '#e0e7ff' || color === '#d1fae5' || color === '#f3f4f6' ? '#333' : '#fff');
                          updateConfigFromForm();
                        }}
                        style={{ 
                          background: color,
                          border: '1px solid #d9d9d9',
                          width: 40,
                          height: 32
                        }}
                      />
                    ))}
                  </Space>
                </div>
                <Input 
                  placeholder='或输入颜色代码，如：#f0f9ff'
                  onChange={() => updateConfigFromForm()}
                />
              </div>
            </Form.Item>
            
            <Form.Item 
              name="textColor" 
              label={
                <Space>
                  <span>文字颜色</span>
                  <Tooltip title="设置文字颜色，确保与背景颜色对比度足够，便于阅读">
                    <QuestionCircleOutlined style={{ color: '#999' }} />
                  </Tooltip>
                </Space>
              }
            >
              <div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>快速选择：</div>
                  <Space wrap>
                    {['#333333', '#ffffff', '#1890ff', '#52c41a', '#faad14', '#f5222d'].map(color => (
                      <Button
                        key={color}
                        size="small"
                        onClick={() => {
                          form.setFieldValue('textColor', color);
                          updateConfigFromForm();
                        }}
                        style={{ 
                          background: color,
                          border: '1px solid #d9d9d9',
                          width: 40,
                          height: 32
                        }}
                      />
                    ))}
                  </Space>
                </div>
                <Input 
                  placeholder='或输入颜色代码，如：#333'
                  onChange={() => updateConfigFromForm()}
                />
              </div>
            </Form.Item>
          </Panel>
        )}

        {moduleType === 'custom' && (
          <Panel header="自定义HTML配置" key="custom">
            <Form.Item name="html" label="HTML内容">
              <TextArea 
                rows={6} 
                placeholder="输入HTML代码"
                style={{ fontFamily: 'monospace' }}
                onChange={() => updateConfigFromForm()}
              />
            </Form.Item>
            <Form.Item name="css" label="CSS样式（可选）">
              <TextArea 
                rows={4} 
                placeholder="输入CSS样式代码"
                style={{ fontFamily: 'monospace' }}
                onChange={() => updateConfigFromForm()}
              />
            </Form.Item>
            <Form.Item name="js" label="JavaScript代码（可选）">
              <TextArea 
                rows={4} 
                placeholder="输入JavaScript代码"
                style={{ fontFamily: 'monospace' }}
                onChange={() => updateConfigFromForm()}
              />
            </Form.Item>
          </Panel>
        )}

        <Panel header="定时设置" key="schedule">
          <Form.Item name="startDate" label="开始时间" tooltip="模块开始显示的时间（可选）">
            <DatePicker 
              showTime 
              style={{ width: '100%' }}
              onChange={(date) => {
                if (date) {
                  updateConfigFromForm();
                }
              }}
            />
          </Form.Item>
          <Form.Item name="endDate" label="结束时间" tooltip="模块自动下线的时间（可选）">
            <DatePicker 
              showTime 
              style={{ width: '100%' }}
              onChange={(date) => {
                if (date) {
                  updateConfigFromForm();
                }
              }}
            />
          </Form.Item>
        </Panel>

        <Panel header="高级配置（仅限技术人员）" key="advanced">
          <Alert
            message="⚠️ 高级功能"
            description="此功能仅适用于熟悉JSON格式的技术人员。普通用户请使用上方的可视化配置，系统会自动生成配置。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form.Item 
            name="config" 
            label={
              <Space>
                <span>配置代码（JSON格式）</span>
                <Tooltip title="下方显示自动生成的配置代码，通常无需手动修改。如需修改，请确保JSON格式正确，否则可能导致模块无法正常显示。">
                  <QuestionCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </Space>
            }
            rules={[
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  try {
                    JSON.parse(value);
                    return Promise.resolve();
                  } catch (e: any) {
                    return Promise.reject(new Error('配置格式错误，请检查JSON格式是否正确（缺少引号、逗号等）'));
                  }
                },
              },
            ]}
          >
            <TextArea 
              rows={8} 
              placeholder='系统会自动生成配置代码，通常无需手动修改'
              style={{ fontFamily: 'monospace', fontSize: 12 }}
              onChange={() => {
                // 当手动编辑JSON时，尝试解析并更新表单字段
                try {
                  const configStr = form.getFieldValue('config');
                  if (configStr) {
                    const config = JSON.parse(configStr);
                    if (config.position) form.setFieldValue('position', config.position);
                    if (config.moduleType) form.setFieldValue('moduleType', config.moduleType);
                    if (config.content) form.setFieldValue('content', config.content);
                    if (config.linkUrl) form.setFieldValue('linkUrl', config.linkUrl);
                    if (config.buttonText) form.setFieldValue('buttonText', config.buttonText);
                    if (config.gradient) form.setFieldValue('gradient', config.gradient);
                    if (config.backgroundColor) form.setFieldValue('backgroundColor', config.backgroundColor);
                    if (config.textColor) form.setFieldValue('textColor', config.textColor);
                    if (config.imageUrl) form.setFieldValue('imageUrl', config.imageUrl);
                    if (config.type) form.setFieldValue('announcementType', config.type);
                    if (config.html) form.setFieldValue('html', config.html);
                    if (config.css) form.setFieldValue('css', config.css);
                    if (config.js) form.setFieldValue('js', config.js);
                  }
                } catch (e) {
                  // JSON解析失败，忽略
                }
              }}
            />
          </Form.Item>
        </Panel>
      </Collapse>
    );
  };

  const columns: ColumnsType<HomeModule> = [
    {
      title: '排序',
      key: 'order',
      width: 80,
      render: (_: any, record: HomeModule, index: number) => (
        <Space direction="vertical" size="small">
          <Button
            type="text"
            size="small"
            icon={<UpOutlined />}
            disabled={index === 0}
            onClick={() => handleMoveOrder(record, 'up')}
          />
          <span style={{ fontWeight: 'bold' }}>{record.order}</span>
          <Button
            type="text"
            size="small"
            icon={<DownOutlined />}
            disabled={index === filteredModules.length - 1}
            onClick={() => handleMoveOrder(record, 'down')}
          />
        </Space>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      ellipsis: true,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Badge 
          status={isActive ? 'success' : 'default'} 
          text={isActive ? '启用' : '禁用'}
        />
      ),
      filters: [
        { text: '启用', value: true },
        { text: '禁用', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-',
      sorter: (a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_: any, record: HomeModule) => (
        <Space>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          </Tooltip>
          <Tooltip title="复制">
            <Button type="link" icon={<CopyOutlined />} onClick={() => handleCopy(record)}>
              复制
            </Button>
          </Tooltip>
          <Tooltip title={record.isActive ? '禁用' : '启用'}>
            <Button 
              type="link" 
              icon={record.isActive ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
              onClick={() => handleToggleStatus(record)}
            >
              {record.isActive ? '禁用' : '启用'}
            </Button>
          </Tooltip>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个模块吗？此操作不可恢复。"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="删除">
              <Button type="link" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>首页运营模块管理</h1>
          <p style={{ margin: '8px 0 0 0', color: '#666' }}>
            管理首页展示的各类运营模块，支持自定义配置和排序
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增模块
        </Button>
      </div>

      {/* 搜索和筛选栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input.Search
              placeholder="搜索模块名称或标题"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={filterModules}
            />
          </Col>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="筛选状态"
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Col>
          <Col span={10}>
            <Space>
              <span>共 {filteredModules.length} 个模块</span>
              <Divider type="vertical" />
              <span>启用: {modules.filter(m => m.isActive).length}</span>
              <span>禁用: {modules.filter(m => !m.isActive).length}</span>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table
        loading={loading}
        columns={columns}
        dataSource={filteredModules}
        rowKey="id"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
        scroll={{ x: 1200 }}
      />

      {/* 创建/编辑弹窗 */}
      <Modal
        title={
          <Space>
            {editingModule ? '编辑模块' : '新增模块'}
            <Button type="link" icon={<EyeOutlined />} onClick={handlePreview}>
              预览
            </Button>
          </Space>
        }
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
        }}
        footer={null}
        width={900}
        destroyOnHidden
      >
        <Form 
          form={form} 
          onFinish={handleSubmit} 
          layout="vertical"
          initialValues={{
            isActive: true,
            order: 0,
          }}
        >
          <Alert
            message="创建新模块"
            description="请按照以下步骤配置：1) 选择模块类型 2) 填写内容 3) 设置位置和样式 4) 保存"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item 
            name="name" 
            label={
              <Space>
                <span>模块标识</span>
                <Tooltip title="系统内部使用的唯一标识，只能包含小写字母、数字、下划线和连字符，例如：home_banner_1">
                  <QuestionCircleOutlined style={{ color: '#999' }} />
                </Tooltip>
              </Space>
            }
            rules={[
              { required: true, message: '请输入模块标识' },
              { pattern: /^[a-z0-9_-]+$/, message: '只能包含小写字母、数字、下划线和连字符' }
            ]}
          >
            <Input placeholder="例如: home_banner_1（仅用于系统识别，用户看不到）" />
          </Form.Item>

          {renderConfigForm()}

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingModule ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setShowModal(false)}>取消</Button>
              <Button type="default" icon={<EyeOutlined />} onClick={handlePreview}>
                预览
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 预览弹窗 */}
      <Modal
        title="模块预览"
        open={showPreview}
        onCancel={() => setShowPreview(false)}
        footer={null}
        width={800}
      >
        {previewData && (
          <Card>
            <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
              {JSON.stringify(previewData, null, 2)}
            </pre>
          </Card>
        )}
      </Modal>

      {/* 模板选择弹窗 */}
      <Modal
        title="选择模板"
        open={showTemplateModal}
        onCancel={() => {
          setShowTemplateModal(false);
          // 如果取消模板选择，直接打开创建弹窗
          setShowModal(true);
        }}
        footer={[
          <Button key="skip" onClick={() => {
            setShowTemplateModal(false);
            setShowModal(true);
          }}>
            跳过，直接创建
          </Button>
        ]}
        width={900}
      >
        <Alert
          message="使用模板快速创建"
          description="选择一个模板可以快速填充配置，您可以在创建时修改任何内容。如果不需要模板，可以点击下方的「跳过，直接创建」按钮。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Row gutter={[16, 16]}>
          {MODULE_TEMPLATES.map((template) => (
            <Col xs={24} sm={12} lg={8} key={template.id}>
              <Card
                hoverable
                style={{ height: '100%' }}
                onClick={() => handleUseTemplate(template)}
                cover={
                  <div style={{
                    height: 120,
                    background: template.gradient || template.backgroundColor || '#f0f9ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: template.textColor || '#333',
                    fontSize: 16,
                    fontWeight: 600,
                  }}>
                    {template.type === 'banner' && '🖼️'}
                    {template.type === 'announcement' && '📢'}
                    {template.type === 'promotion' && '🎯'}
                    {template.type === 'custom' && '⚙️'}
                  </div>
                }
              >
                <div style={{ padding: '12px 0' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                    {template.name}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Tag color="blue">{template.type === 'banner' ? 'Banner' : template.type === 'announcement' ? '公告' : template.type === 'promotion' ? '推广' : '自定义'}</Tag>
                    <Tag color="green">{template.position === 'top' ? '顶部' : '底部'}</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {template.description}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Modal>
    </div>
  );
}
