'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Select, 
  Input, 
  message, 
  Typography,
  Tooltip,
  Empty
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  SaveOutlined, 
  CopyOutlined,
  SettingOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  TableOutlined
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export interface ReportWidget {
  id: string;
  type: 'statistic' | 'chart' | 'table' | 'text';
  title: string;
  config?: { chartType?: string; content?: string };
  data?: { value?: number };
  position: { row: number; col: number };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  widgets: ReportWidget[];
  createdAt: string;
  updatedAt: string;
}

interface CustomReportProps {
  open: boolean;
  onClose: () => void;
  dataSources?: Record<string, unknown[]>;
  onSave?: (report: ReportTemplate) => Promise<void>;
}

const WIDGET_TYPES = [
  { type: 'statistic', icon: <BarChartOutlined />, label: '统计卡片', description: '显示关键指标' },
  { type: 'chart', icon: <LineChartOutlined />, label: '图表', description: '折线图、柱状图等' },
  { type: 'table', icon: <TableOutlined />, label: '表格', description: '数据表格展示' },
  { type: 'text', icon: <SettingOutlined />, label: '文本', description: '自定义文本内容' },
];

const CHART_TYPES = [
  { value: 'line', label: '折线图' },
  { value: 'bar', label: '柱状图' },
  { value: 'area', label: '面积图' },
  { value: 'pie', label: '饼图' },
];

type TemplateFormValues = { name: string; description?: string };
type WidgetFormValues = { type: ReportWidget['type']; title: string; config?: { chartType?: string } };

export default function CustomReport({ open, onClose, dataSources = {}, onSave }: CustomReportProps) {
  void dataSources;
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);
  const [widgetForm] = Form.useForm();
  const [templateForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const saved = localStorage.getItem('reportTemplates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    }
  };

  const saveTemplates = (newTemplates: ReportTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('reportTemplates', JSON.stringify(newTemplates));
  };

  const handleCreateTemplate = async (values: TemplateFormValues) => {
    const newTemplate: ReportTemplate = {
      id: `template_${Date.now()}`,
      name: values.name,
      description: values.description || '',
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newTemplates = [...templates, newTemplate];
    saveTemplates(newTemplates);
    setSelectedTemplate(newTemplate);
    setTemplateModalOpen(false);
    templateForm.resetFields();
    message.success('报表模板创建成功');
  };

  const handleUpdateTemplate = async (values: TemplateFormValues) => {
    if (!editingTemplate) return;

    const updatedTemplate: ReportTemplate = {
      ...editingTemplate,
      name: values.name,
      description: values.description || '',
      updatedAt: new Date().toISOString(),
    };

    const newTemplates = templates.map(t => 
      t.id === editingTemplate.id ? updatedTemplate : t
    );
    saveTemplates(newTemplates);
    setSelectedTemplate(updatedTemplate);
    setTemplateModalOpen(false);
    templateForm.resetFields();
    message.success('报表模板更新成功');
  };

  const handleDeleteTemplate = (templateId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个报表模板吗？',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        const newTemplates = templates.filter(t => t.id !== templateId);
        saveTemplates(newTemplates);
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
        }
        message.success('删除成功');
      },
    });
  };

  const handleDuplicateTemplate = (template: ReportTemplate) => {
    const newTemplate: ReportTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (副本)`,
      widgets: template.widgets.map(w => ({ ...w, id: `widget_${Date.now()}_${Math.random()}` })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newTemplates = [...templates, newTemplate];
    saveTemplates(newTemplates);
    setSelectedTemplate(newTemplate);
    message.success('复制成功');
  };

  const handleAddWidget = async (values: WidgetFormValues) => {
    if (!selectedTemplate) return;

    const newWidget: ReportWidget = {
      id: `widget_${Date.now()}`,
      type: values.type,
      title: values.title,
      config: values.config || {},
      position: { row: 0, col: 0 },
    };

    const updatedTemplate: ReportTemplate = {
      ...selectedTemplate,
      widgets: [...selectedTemplate.widgets, newWidget],
      updatedAt: new Date().toISOString(),
    };

    const newTemplates = templates.map(t => 
      t.id === selectedTemplate.id ? updatedTemplate : t
    );
    saveTemplates(newTemplates);
    setSelectedTemplate(updatedTemplate);
    setWidgetModalOpen(false);
    widgetForm.resetFields();
    message.success('组件添加成功');
  };

  const handleDeleteWidget = (widgetId: string) => {
    if (!selectedTemplate) return;

    const updatedTemplate: ReportTemplate = {
      ...selectedTemplate,
      widgets: selectedTemplate.widgets.filter(w => w.id !== widgetId),
      updatedAt: new Date().toISOString(),
    };

    const newTemplates = templates.map(t => 
      t.id === selectedTemplate.id ? updatedTemplate : t
    );
    saveTemplates(newTemplates);
    setSelectedTemplate(updatedTemplate);
    message.success('组件删除成功');
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !selectedTemplate) return;

    const widgets = [...selectedTemplate.widgets];
    const [reorderedWidget] = widgets.splice(result.source.index, 1);
    widgets.splice(result.destination.index, 0, reorderedWidget);

    const updatedTemplate: ReportTemplate = {
      ...selectedTemplate,
      widgets,
      updatedAt: new Date().toISOString(),
    };

    const newTemplates = templates.map(t => 
      t.id === selectedTemplate.id ? updatedTemplate : t
    );
    saveTemplates(newTemplates);
    setSelectedTemplate(updatedTemplate);
  };

  const handleSaveReport = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      await onSave?.(selectedTemplate);
      message.success('报表保存成功');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '报表保存失败';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderWidget = (widget: ReportWidget) => {
    switch (widget.type) {
      case 'statistic':
        return (
          <Card size="small" style={{ height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 600, color: '#1890FF' }}>
                {widget.data?.value || 0}
              </div>
              <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>
                {widget.title}
              </div>
            </div>
          </Card>
        );

      case 'chart':
        return (
          <Card size="small" title={widget.title} style={{ height: '100%' }}>
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              {widget.config?.chartType === 'line' && <LineChartOutlined style={{ fontSize: 48 }} />}
              {widget.config?.chartType === 'bar' && <BarChartOutlined style={{ fontSize: 48 }} />}
              {widget.config?.chartType === 'area' && <PieChartOutlined style={{ fontSize: 48 }} />}
              {!widget.config?.chartType && <BarChartOutlined style={{ fontSize: 48 }} />}
            </div>
          </Card>
        );

      case 'table':
        return (
          <Card size="small" title={widget.title} style={{ height: '100%' }}>
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              <TableOutlined style={{ fontSize: 48 }} />
            </div>
          </Card>
        );

      case 'text':
        return (
          <Card size="small" title={widget.title} style={{ height: '100%' }}>
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
              {widget.config?.content || '自定义文本内容'}
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <BarChartOutlined />
          <span>自定义报表</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1200}
      footer={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => setTemplateModalOpen(true)}>
              新建模板
            </Button>
          </Space>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleSaveReport}
              loading={loading}
              disabled={!selectedTemplate}
            >
              保存报表
            </Button>
          </Space>
        </Space>
      }
    >
      <Row gutter={16} style={{ height: 600 }}>
        <Col span={6} style={{ borderRight: '1px solid #f0f0f0', height: '100%', overflowY: 'auto' }}>
          <div style={{ marginBottom: 16 }}>
            <Title level={5} style={{ marginBottom: 12 }}>报表模板</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: selectedTemplate?.id === template.id ? '#e6f7ff' : '#f5f5f5',
                    border: selectedTemplate?.id === template.id ? '1px solid #1890ff' : '1px solid #e8e8e8',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTemplate?.id !== template.id) {
                      e.currentTarget.style.background = '#fafafa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTemplate?.id !== template.id) {
                      e.currentTarget.style.background = '#f5f5f5';
                    }
                  }}
                >
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{template.name}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{template.description}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                    {dayjs(template.createdAt).format('YYYY-MM-DD')}
                  </div>
                </div>
              ))}
            </Space>
          </div>

          {templates.length === 0 && (
            <Empty description="暂无报表模板" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Col>

        <Col span={18} style={{ height: '100%', overflowY: 'auto', paddingLeft: 16 }}>
          {selectedTemplate ? (
            <>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Title level={4} style={{ marginBottom: 4 }}>{selectedTemplate.name}</Title>
                  <Text type="secondary">{selectedTemplate.description}</Text>
                </div>
                <Space>
                  <Tooltip title="编辑模板">
                    <Button 
                      icon={<EditOutlined />} 
                      onClick={() => {
                        setEditingTemplate(selectedTemplate);
                        templateForm.setFieldsValue({
                          name: selectedTemplate.name,
                          description: selectedTemplate.description,
                        });
                        setTemplateModalOpen(true);
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="复制模板">
                    <Button 
                      icon={<CopyOutlined />} 
                      onClick={() => handleDuplicateTemplate(selectedTemplate)}
                    />
                  </Tooltip>
                  <Tooltip title="删除模板">
                    <Button 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                    />
                  </Tooltip>
                </Space>
              </div>

              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setWidgetModalOpen(true)}
                style={{ marginBottom: 16 }}
              >
                添加组件
              </Button>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="widgets">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      <Row gutter={[16, 16]}>
                        {selectedTemplate.widgets.map((widget, index) => (
                          <Col span={6} key={widget.id}>
                            <Draggable draggableId={widget.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{ position: 'relative' }}
                                >
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDeleteWidget(widget.id)}
                                    style={{
                                      position: 'absolute',
                                      top: 8,
                                      right: 8,
                                      zIndex: 10
                                    }}
                                  />
                                  {renderWidget(widget)}
                                </div>
                              )}
                            </Draggable>
                          </Col>
                        ))}
                      </Row>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {selectedTemplate.widgets.length === 0 && (
                <Empty 
                  description="暂无组件，点击上方按钮添加" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ marginTop: 40 }}
                />
              )}
            </>
          ) : (
            <Empty 
              description="请选择或创建一个报表模板" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: 100 }}
            />
          )}
        </Col>
      </Row>

      <Modal
        title={editingTemplate ? '编辑模板' : '新建模板'}
        open={templateModalOpen}
        onCancel={() => {
          setTemplateModalOpen(false);
          setEditingTemplate(null);
          templateForm.resetFields();
        }}
        onOk={() => templateForm.validateFields().then(editingTemplate ? handleUpdateTemplate : handleCreateTemplate)}
      >
        <Form form={templateForm} layout="vertical">
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" maxLength={50} />
          </Form.Item>
          <Form.Item
            name="description"
            label="模板描述"
          >
            <Input.TextArea placeholder="请输入模板描述" rows={3} maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加组件"
        open={widgetModalOpen}
        onCancel={() => {
          setWidgetModalOpen(false);
          widgetForm.resetFields();
        }}
        onOk={() => widgetForm.validateFields().then(handleAddWidget)}
        width={600}
      >
        <Form form={widgetForm} layout="vertical">
          <Form.Item
            name="type"
            label="组件类型"
            rules={[{ required: true, message: '请选择组件类型' }]}
          >
            <Select placeholder="请选择组件类型">
              {WIDGET_TYPES.map(type => (
                <Select.Option key={type.type} value={type.type}>
                  <Space>
                    {type.icon}
                    <span>{type.label}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>{type.description}</Text>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="组件标题"
            rules={[{ required: true, message: '请输入组件标题' }]}
          >
            <Input placeholder="请输入组件标题" maxLength={50} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              if (type === 'chart') {
                return (
                  <Form.Item
                    name={['config', 'chartType']}
                    label="图表类型"
                    rules={[{ required: true, message: '请选择图表类型' }]}
                  >
                    <Select placeholder="请选择图表类型">
                      {CHART_TYPES.map(chartType => (
                        <Select.Option key={chartType.value} value={chartType.value}>
                          {chartType.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
}
