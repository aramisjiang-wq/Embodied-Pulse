/**
 * 智能检索配置组件
 * 支持：关键词建议、标签联想、作者搜索、UP主选择
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Select,
  Tag,
  Space,
  Button,
  AutoComplete,
  Divider,
  Row,
  Col,
  message,
} from 'antd';
import {
  ThunderboltOutlined,
  BulbOutlined,
} from '@ant-design/icons';

const { Option } = Select;

interface SmartSearchConfigProps {
  contentType: 'paper' | 'video' | 'repo' | 'huggingface' | 'job';
  value?: {
    keywords?: string[];
    tags?: string[];
    authors?: string[];
    uploaders?: string[];
    platform?: string;
  };
  onChange?: (value: {
    keywords?: string[];
    tags?: string[];
    authors?: string[];
    uploaders?: string[];
    platform?: string;
  }) => void;
}

// 预置关键词库（分类别）
const PRESET_KEYWORDS = {
  paper: [
    // 具身智能核心
    'Embodied AI', 'Embodied Intelligence', 'Robotics', 'Robot Learning',
    // 感知
    'Computer Vision', 'Visual Perception', 'Scene Understanding', '3D Vision',
    // 导航与规划
    'Navigation', 'Path Planning', 'SLAM', 'Autonomous Navigation',
    // 操作与控制
    'Manipulation', 'Grasping', 'Motor Control', 'Dexterous Manipulation',
    // 学习方法
    'Reinforcement Learning', 'Imitation Learning', 'Transfer Learning', 'Meta Learning',
    // 多模态
    'Vision-Language', 'Multimodal Learning', 'Cross-modal', 'VLM',
    // 仿真
    'Simulation', 'Sim-to-Real', 'Digital Twin', 'Virtual Environment',
  ],
  video: [
    '具身智能', '机器人', '深度学习', 'AI技术', '强化学习',
    '计算机视觉', '自动驾驶', '机械臂', '人形机器人',
  ],
  repo: [
    'robot', 'embodied', 'reinforcement-learning', 'computer-vision',
    'manipulation', 'navigation', 'pytorch', 'tensorflow',
  ],
  huggingface: [
    'robotics', 'vision-language', 'multimodal', 'control',
  ],
  job: [
    '具身智能', '机器人', '算法工程师', '深度学习', 'CV',
  ],
};

// 预置标签
const PRESET_TAGS = {
  paper: ['高引用', '最新', '经典', '综述', '开源'],
  video: ['教程', '论文解读', '项目实战', '前沿技术'],
  repo: ['热门', '活跃', '文档完善', '易上手'],
  huggingface: ['预训练', '微调', '推理优化'],
  job: ['远程', '应届', '高薪', '大厂'],
};

// 知名作者/机构
const FAMOUS_AUTHORS = [
  'Sergey Levine', 'Pieter Abbeel', 'Chelsea Finn', 'Lerrel Pinto',
  'OpenAI', 'DeepMind', 'Google Research', 'UC Berkeley', 'Stanford',
  'MIT CSAIL', 'CMU', 'Meta AI', 'Microsoft Research',
];

// 知名UP主
const FAMOUS_UPLOADERS = {
  bilibili: ['跟李沐学AI', '我是科学家iScientist', '3Blue1Brown', 'Lex Fridman'],
  youtube: ['Two Minute Papers', 'Lex Fridman', 'Yannic Kilcher', 'AI Coffee Break'],
};

export default function SmartSearchConfig({ contentType, value = {}, onChange }: SmartSearchConfigProps) {
  const [keywords, setKeywords] = useState<string[]>(value.keywords || []);
  const [tags, setTags] = useState<string[]>(value.tags || []);
  const [authors, setAuthors] = useState<string[]>(value.authors || []);
  const [uploaders, setUploaders] = useState<string[]>(value.uploaders || []);
  const [platform, setPlatform] = useState<string>(value.platform || '');

  const [keywordInput, setKeywordInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [uploaderInput, setUploaderInput] = useState('');

  // 同步到父组件
  useEffect(() => {
    if (onChange) {
      onChange({
        keywords,
        tags,
        authors,
        uploaders,
        platform,
      });
    }
  }, [keywords, tags, authors, uploaders, platform, onChange]);

  // 添加关键词
  const addKeyword = (keyword: string) => {
    if (keyword && !keywords.includes(keyword)) {
      setKeywords([...keywords, keyword]);
      setKeywordInput('');
    }
  };

  // 智能推荐关键词
  const suggestKeywords = () => {
    const suggestions = PRESET_KEYWORDS[contentType] || [];
    const available = suggestions.filter(k => !keywords.includes(k));
    
    if (available.length > 0) {
      // 随机推荐3个
      const randomSuggestions = available.sort(() => 0.5 - Math.random()).slice(0, 3);
      setKeywords([...keywords, ...randomSuggestions]);
      message.success(`已添加${randomSuggestions.length}个推荐关键词`);
    } else {
      message.info('已添加所有推荐关键词');
    }
  };

  // 快速添加预置关键词
  const QuickAddKeywords = () => (
    <Card size="small" title={<><BulbOutlined /> 推荐关键词</>} style={{ marginBottom: 16 }}>
      <Space wrap>
        {(PRESET_KEYWORDS[contentType] || []).map(keyword => (
          <Tag
            key={keyword}
            style={{ cursor: 'pointer' }}
            color={keywords.includes(keyword) ? 'blue' : 'default'}
            onClick={() => {
              if (keywords.includes(keyword)) {
                setKeywords(keywords.filter(k => k !== keyword));
              } else {
                setKeywords([...keywords, keyword]);
              }
            }}
          >
            {keyword}
          </Tag>
        ))}
      </Space>
    </Card>
  );

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* 关键词配置 */}
      <Card
        title="关键词配置"
        size="small"
        extra={
          <Button
            type="link"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={suggestKeywords}
          >
            智能推荐
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <AutoComplete
            style={{ width: '100%' }}
            value={keywordInput}
            onChange={setKeywordInput}
            onSelect={addKeyword}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter') {
                addKeyword(keywordInput);
              }
            }}
            options={(PRESET_KEYWORDS[contentType] || [])
              .filter(k => k.toLowerCase().includes(keywordInput.toLowerCase()) && !keywords.includes(k))
              .map(k => ({ value: k }))
            }
            placeholder="输入关键词，支持自动补全"
          />
          
          <div>
            <Space wrap>
              {keywords.map(keyword => (
                <Tag
                  key={keyword}
                  closable
                  onClose={() => setKeywords(keywords.filter(k => k !== keyword))}
                  color="blue"
                >
                  {keyword}
                </Tag>
              ))}
            </Space>
          </div>
        </Space>

        <Divider style={{ margin: '12px 0' }} />

        <QuickAddKeywords />
      </Card>

      {/* 标签配置 */}
      {(PRESET_TAGS[contentType] || []).length > 0 && (
        <Card title="标签筛选" size="small">
          <Space wrap>
            {(PRESET_TAGS[contentType] || []).map(tag => (
              <Tag
                key={tag}
                style={{ cursor: 'pointer' }}
                color={tags.includes(tag) ? 'green' : 'default'}
                onClick={() => {
                  if (tags.includes(tag)) {
                    setTags(tags.filter(t => t !== tag));
                  } else {
                    setTags([...tags, tag]);
                  }
                }}
              >
                {tag}
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      {/* 作者配置（论文专用） */}
      {contentType === 'paper' && (
        <Card title="作者筛选" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <AutoComplete
              style={{ width: '100%' }}
              value={authorInput}
              onChange={setAuthorInput}
              onSelect={(value) => {
                if (!authors.includes(value)) {
                  setAuthors([...authors, value]);
                  setAuthorInput('');
                }
              }}
              options={FAMOUS_AUTHORS
                .filter(a => a.toLowerCase().includes(authorInput.toLowerCase()) && !authors.includes(a))
                .map(a => ({ value: a }))
              }
              placeholder="输入作者或机构名称"
            />
            
            <Space wrap>
              {authors.map(author => (
                <Tag
                  key={author}
                  closable
                  onClose={() => setAuthors(authors.filter(a => a !== author))}
                  color="purple"
                >
                  {author}
                </Tag>
              ))}
            </Space>
          </Space>
        </Card>
      )}

      {/* UP主配置（视频专用） */}
      {contentType === 'video' && (
        <Card title="UP主配置" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={8}>
              <Col span={8}>
                <Select
                  style={{ width: '100%' }}
                  value={platform}
                  onChange={setPlatform}
                  placeholder="选择平台"
                >
                  <Option value="">全部平台</Option>
                  <Option value="bilibili">B站</Option>
                  <Option value="youtube">YouTube</Option>
                </Select>
              </Col>
              <Col span={16}>
                <AutoComplete
                  style={{ width: '100%' }}
                  value={uploaderInput}
                  onChange={setUploaderInput}
                  onSelect={(value) => {
                    if (!uploaders.includes(value)) {
                      setUploaders([...uploaders, value]);
                      setUploaderInput('');
                    }
                  }}
                  options={[
                    ...(FAMOUS_UPLOADERS.bilibili || []),
                    ...(FAMOUS_UPLOADERS.youtube || []),
                  ]
                    .filter(u => u.toLowerCase().includes(uploaderInput.toLowerCase()) && !uploaders.includes(u))
                    .map(u => ({ value: u }))
                  }
                  placeholder="输入UP主名称"
                />
              </Col>
            </Row>

            <Space wrap>
              {uploaders.map(uploader => (
                <Tag
                  key={uploader}
                  closable
                  onClose={() => setUploaders(uploaders.filter(u => u !== uploader))}
                  color="orange"
                >
                  {uploader}
                </Tag>
              ))}
            </Space>
          </Space>
        </Card>
      )}

      {/* 配置总结 */}
      <Card title="配置总结" size="small">
        <Space direction="vertical">
          {keywords.length > 0 && <div>关键词: {keywords.length}个</div>}
          {tags.length > 0 && <div>标签: {tags.length}个</div>}
          {authors.length > 0 && <div>作者: {authors.length}个</div>}
          {uploaders.length > 0 && <div>UP主: {uploaders.length}个</div>}
          {platform && <div>平台: {platform}</div>}
        </Space>
      </Card>
    </Space>
  );
}
