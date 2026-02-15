/**
 * 管理端 - Banner管理页面（重新设计）
 * 功能：
 * - 图片上传（支持拖拽、预览）
 * - 排序管理
 * - 批量操作
 * - 实时预览
 * - 状态管理
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  App, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Switch, 
  Tag, 
  Upload, 
  Card,
  Image,
  Popconfirm,
  message,
  Row,
  Col,
  Tooltip,
  Typography,
  Divider,
  Badge,
  type UploadProps,
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  UploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  ReloadOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { bannerApi } from '@/lib/api/banner';
import { Banner } from '@/lib/api/types';
import type { RcFile } from 'antd/es/upload';
import type { UploadRequestOption, UploadRequestError } from 'rc-upload/lib/interface';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title, Text } = Typography;

export default function AdminBannersPage() {
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const response = await bannerApi.getBanners({ page: 1, size: 100 });
      
      let bannerList: Banner[] = [];
      if (Array.isArray(response)) {
        bannerList = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.items)) {
          bannerList = response.items;
        }
      }
      
      // 按sortOrder排序
      bannerList.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setBanners(bannerList);
    } catch (error: any) {
      console.error('Load banners error:', error);
      handleError(error, '加载失败');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  type ApiError = { status?: number; code?: string; message?: string; response?: { data?: { code?: number; message?: string } } };
  const handleError = (error: unknown, defaultMessage: string) => {
    const err = (typeof error === 'object' && error !== null ? error as ApiError : {});
    if (err.status === 401 || err.code === 'UNAUTHORIZED' || err.response?.data?.code === 1002 || err.response?.data?.code === 1003) {
      messageApi.error('未登录或登录已过期，请重新登录');
    } else if (err.code === 'CONNECTION_REFUSED' || err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR') {
      messageApi.error('后端服务未运行，请确保后端服务已启动');
    } else {
      messageApi.error(err.message || err.response?.data?.message || defaultMessage);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setImageUrl(banner.imageUrl);
    form.setFieldsValue({
      title: banner.title,
      description: banner.description || '',
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      sortOrder: banner.sortOrder || 0,
      isActive: banner.isActive,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    if (banners.length >= 3) {
      messageApi.warning('最多只能创建3个Banner，请先删除或禁用现有Banner');
      return;
    }
    setEditingBanner(null);
    setImageUrl('');
    form.resetFields();
    form.setFieldsValue({
      sortOrder: banners.length,
      isActive: true,
    });
    setShowModal(true);
  };

  // 自定义上传请求
  const customRequest = async (options: UploadRequestOption) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);

    try {
      if (typeof file === 'string') {
        const uploadError: UploadRequestError = new Error('无效的文件');
        onError?.(uploadError);
        return;
      }
      const uploadFile = file as RcFile;
      const result = await bannerApi.uploadImage(uploadFile as File);
      setImageUrl(result.url);
      form.setFieldsValue({ imageUrl: result.url });
      messageApi.success('图片上传成功');
      onSuccess?.(result, uploadFile);
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const err = error as { message?: string };
      messageApi.error(err.message || '图片上传失败');
      const uploadError: UploadRequestError = error instanceof Error ? error : new Error('图片上传失败');
      onError?.(uploadError);
    } finally {
      setUploading(false);
    }
  };

  const beforeUpload = (file: RcFile): boolean => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      messageApi.error('只能上传图片文件！');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      messageApi.error('图片大小不能超过5MB！');
      return false;
    }
    return true;
  };

  const handleDelete = async (id: string) => {
    try {
      await bannerApi.deleteBanner(id);
      messageApi.success('删除成功');
      loadBanners();
    } catch (error: unknown) {
      handleError(error, '删除失败');
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await bannerApi.updateBanner(id, { isActive });
      messageApi.success(isActive ? 'Banner已启用' : 'Banner已禁用');
      loadBanners();
    } catch (error: unknown) {
      handleError(error, '操作失败');
    }
  };

  const handleMove = async (banner: Banner, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex(b => b.id === banner.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const newBanners = [...banners];
    [newBanners[currentIndex], newBanners[newIndex]] = [newBanners[newIndex], newBanners[currentIndex]];
    
    // 更新order
    try {
      const updatePromises = newBanners.map((b, index) =>
        bannerApi.updateBanner(b.id, { sortOrder: index })
      );
      await Promise.all(updatePromises);
      messageApi.success('排序已更新');
      loadBanners();
    } catch (error: unknown) {
      handleError(error, '排序更新失败');
    }
  };

  const handleSubmit = async (values: { title: string; description?: string; linkUrl?: string; sortOrder?: number; isActive?: boolean }) => {
    try {
      if (!imageUrl) {
        messageApi.error('请上传图片');
        return;
      }

      const data: Omit<Banner, 'id' | 'createdAt'> = {
        ...values,
        imageUrl,
        title: values.title,
        description: values.description,
        linkUrl: values.linkUrl,
        sortOrder: values.sortOrder ?? 0,
        isActive: values.isActive ?? true,
      } as Omit<Banner, 'id' | 'createdAt'>;

      if (editingBanner) {
        await bannerApi.updateBanner(editingBanner.id, data);
        messageApi.success('更新成功');
      } else {
        await bannerApi.createBanner(data);
        messageApi.success('创建成功');
      }
      setShowModal(false);
      setImageUrl('');
      form.resetFields();
      loadBanners();
    } catch (error: unknown) {
      handleError(error, '操作失败');
    }
  };

  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => (
        <Badge count={index + 1} showZero style={{ backgroundColor: '#52c41a' }} />
      ),
    },
    {
      title: '预览',
      dataIndex: 'imageUrl',
      key: 'preview',
      width: 150,
      render: (url: string, record: Banner) => (
        <div style={{ position: 'relative' }}>
          <Image
            src={url}
            alt={record.title}
            width={120}
            height={72}
            style={{ objectFit: 'cover', borderRadius: 4, border: '1px solid #f0f0f0' }}
            preview={{
              mask: (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <EyeOutlined /> 预览
                </div>
              ),
            }}
          />
        </div>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (title: string, record: Banner) => (
        <div>
          <Text strong style={{ fontSize: 15 }}>{title}</Text>
          {record.description && (
            <div style={{ marginTop: 4, fontSize: 12, color: '#666', lineHeight: 1.5 }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '跳转链接',
      dataIndex: 'linkUrl',
      key: 'linkUrl',
      width: 200,
      ellipsis: true,
      render: (url: string) => url ? (
        <Tooltip title={url}>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
            {url.length > 25 ? url.substring(0, 25) + '...' : url}
          </a>
        </Tooltip>
      ) : <Text type="secondary">-</Text>,
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
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 100,
      sorter: (a: Banner, b: Banner) => (a.sortOrder || 0) - (b.sortOrder || 0),
      render: (sortOrder: number) => <Tag color="blue">{sortOrder}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: Banner, index: number) => (
        <Space size="small">
          <Tooltip title="上移">
            <Button 
              type="text" 
              size="small"
              icon={<ArrowUpOutlined />}
              disabled={index === 0}
              onClick={() => handleMove(record, 'up')}
            />
          </Tooltip>
          <Tooltip title="下移">
            <Button 
              type="text" 
              size="small"
              icon={<ArrowDownOutlined />}
              disabled={index === banners.length - 1}
              onClick={() => handleMove(record, 'down')}
            />
          </Tooltip>
          <Tooltip title="预览">
            <Button 
              type="text" 
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setPreviewImage(record.imageUrl);
                setPreviewVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? '禁用' : '启用'}>
            <Button 
              type="text"
              size="small"
              icon={record.isActive ? <CloseOutlined /> : <CheckOutlined />}
              onClick={() => handleToggle(record.id, !record.isActive)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除此Banner？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button 
                type="text" 
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Banner管理</Title>
            <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
              最多支持3个Banner轮播，当前：<Text strong>{banners.length}</Text>/3
              {banners.filter(b => b.isActive).length > 0 && (
                <span style={{ marginLeft: 16 }}>
                  启用中：<Text strong style={{ color: '#52c41a' }}>{banners.filter(b => b.isActive).length}</Text> 个
                </span>
              )}
            </Text>
          </div>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadBanners}
              loading={loading}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreate}
              disabled={banners.length >= 3}
            >
              新增Banner
            </Button>
          </Space>
        </div>
      </Card>

      <Card>
        <Table
          loading={loading}
          columns={columns}
          dataSource={banners}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1400 }}
          size="middle"
        />
      </Card>

      <Modal
        title={
          <div>
            <span>{editingBanner ? '编辑Banner' : '新增Banner'}</span>
            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12, fontWeight: 'normal' }}>
              推荐尺寸：1200x300px，支持JPG/PNG/GIF/WebP，最大5MB
            </Text>
          </div>
        }
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setImageUrl('');
          form.resetFields();
        }}
        footer={null}
        width={700}
        destroyOnHidden
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="Banner标题，会显示在轮播图上" size="large" />
          </Form.Item>

          <Form.Item name="description" label="描述（可选）">
            <TextArea 
              rows={3} 
              placeholder="Banner的描述文字，会显示在轮播图标题下方" 
            />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="图片"
            rules={[{ required: true, message: '请上传图片' }]}
            extra="支持拖拽上传，或点击选择文件。也可以直接输入图片URL"
          >
            <div>
              <Upload
                name="image"
                listType="picture-card"
                showUploadList={false}
                beforeUpload={beforeUpload}
                customRequest={customRequest}
                accept="image/*"
                disabled={uploading}
                style={{ width: '100%' }}
              >
                {imageUrl ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img 
                      src={imageUrl} 
                      alt="banner" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} 
                    />
                    {uploading && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        borderRadius: 4,
                      }}>
                        <UploadOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                        <div>上传中...</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {uploading ? (
                      <div>
                        <UploadOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                        <div style={{ marginTop: 8, color: '#1890ff' }}>上传中...</div>
                      </div>
                    ) : (
                      <>
                        <PictureOutlined style={{ fontSize: 32, color: '#999' }} />
                        <div style={{ marginTop: 8, color: '#999' }}>上传图片</div>
                        <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>支持拖拽</div>
                      </>
                    )}
                  </div>
                )}
              </Upload>
              <div style={{ marginTop: 16 }}>
                <Input
                  placeholder="或直接输入图片URL"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    form.setFieldsValue({ imageUrl: e.target.value });
                  }}
                  size="large"
                  addonAfter={
                    imageUrl ? (
                      <Button 
                        type="link" 
                        size="small"
                        onClick={() => {
                          setPreviewImage(imageUrl);
                          setPreviewVisible(true);
                        }}
                      >
                        预览
                      </Button>
                    ) : null
                  }
                />
              </div>
              {imageUrl && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#666', wordBreak: 'break-all' }}>
                  当前图片: {imageUrl}
                </div>
              )}
            </div>
          </Form.Item>

          <Form.Item 
            name="linkUrl" 
            label="跳转链接（可选）"
            tooltip="点击Banner后跳转的链接，可以是内部路径（如 /papers）或外部URL"
          >
            <Input placeholder="/papers 或 https://example.com" size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="order"
                label="排序"
                initialValue={0}
                tooltip="数字越小越靠前，用于控制轮播图的显示顺序"
              >
                <InputNumber min={0} style={{ width: '100%' }} size="large" placeholder="数字越小越靠前" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="isActive" 
                label="是否启用" 
                valuePropName="checked" 
                initialValue={true}
              >
                <Switch checkedChildren="启用" unCheckedChildren="禁用" size="default" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setShowModal(false);
                setImageUrl('');
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={uploading} size="large">
                {editingBanner ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={900}
        centered
      >
        <Image
          alt="预览"
          style={{ width: '100%' }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
}
