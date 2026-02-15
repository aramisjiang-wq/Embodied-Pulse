'use client';

import { useMemo } from 'react';
import { Card, Tag, Typography, Row, Col } from 'antd';
import { 
  FolderOutlined,
  ThunderboltOutlined,
  FireOutlined,
  RiseOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Favorite {
  id: string;
  contentType: string;
  detail?: {
    tags?: string[];
    title?: string;
  };
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  color: string;
  favorites: Favorite[];
}

interface SmartCategoriesProps {
  favorites: Favorite[];
  onSelectCategory?: (categoryId: string) => void;
}

export function SmartCategories({ favorites, onSelectCategory }: SmartCategoriesProps) {
  const categories = useMemo(() => {
    const categories: Category[] = [];

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentFavorites = favorites.filter(f => new Date(f.createdAt) > oneWeekAgo);
    const monthFavorites = favorites.filter(f => {
      const date = new Date(f.createdAt);
      return date > oneMonthAgo && date <= oneWeekAgo;
    });
    if (recentFavorites.length > 0) {
      categories.push({
        id: 'recent',
        name: '最近收藏',
        icon: <ClockCircleOutlined style={{ color: '#1890ff' }} />,
        count: recentFavorites.length,
        color: 'blue',
        favorites: recentFavorites,
      });
    }

    if (monthFavorites.length > 0) {
      categories.push({
        id: 'month',
        name: '本月收藏',
        icon: <RiseOutlined style={{ color: '#52c41a' }} />,
        count: monthFavorites.length,
        color: 'green',
        favorites: monthFavorites,
      });
    }

    const contentTypeGroups = favorites.reduce((acc, fav) => {
      if (!acc[fav.contentType]) {
        acc[fav.contentType] = [];
      }
      acc[fav.contentType].push(fav);
      return acc;
    }, {} as Record<string, Favorite[]>);

    const topContentType = Object.entries(contentTypeGroups)
      .sort((a, b) => b[1].length - a[1].length)[0];

    if (topContentType) {
      const contentTypeLabels: Record<string, string> = {
        paper: '论文',
        video: '视频',
        repo: 'GitHub项目',
        huggingface: 'HuggingFace模型',
        job: '招聘岗位',
      };
      const contentTypeColors: Record<string, string> = {
        paper: 'blue',
        video: 'green',
        repo: 'purple',
        huggingface: 'orange',
        job: 'red',
      };

      categories.push({
        id: `type_${topContentType[0]}`,
        name: `${contentTypeLabels[topContentType[0]]}收藏`,
        icon: <FireOutlined style={{ color: '#ff4d4f' }} />,
        count: topContentType[1].length,
        color: contentTypeColors[topContentType[0]],
        favorites: topContentType[1],
      });
    }

    const allTags = favorites.flatMap((fav) => fav.detail?.tags || []);
    const tagFrequency = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topTags = Object.entries(tagFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    topTags.forEach(([tag]) => {
      const taggedFavorites = favorites.filter(fav => 
        fav.detail?.tags?.includes(tag)
      );
      
      if (taggedFavorites.length > 0 && !categories.find(c => c.id === `tag_${tag}`)) {
        categories.push({
          id: `tag_${tag}`,
          name: `标签: ${tag}`,
          icon: <ThunderboltOutlined style={{ color: '#722ed1' }} />,
          count: taggedFavorites.length,
          color: 'purple',
          favorites: taggedFavorites,
        });
      }
    });

    const allKeywords = favorites.flatMap((fav) => (fav.detail?.title ? [fav.detail.title] : []));
    const keywordFrequency = allKeywords.reduce((acc, kw) => {
      const words = (kw as string).toLowerCase().split(/\s+/);
      words.forEach((word: string) => {
        if (word.length > 2) {
          acc[word] = (acc[word] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    const topKeywords = (Object.entries(keywordFrequency) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    topKeywords.forEach(([keyword]) => {
      const keywordFavorites = favorites.filter(fav => 
        fav.detail?.title?.toLowerCase().includes(keyword)
      );
      
      if (keywordFavorites.length > 0 && !categories.find(c => c.id === `keyword_${keyword}`)) {
        categories.push({
          id: `keyword_${keyword}`,
          name: `关键词: ${keyword}`,
          icon: <ThunderboltOutlined style={{ color: '#fa8c16' }} />,
          count: keywordFavorites.length,
          color: 'orange',
          favorites: keywordFavorites,
        });
      }
    });

    return categories.slice(0, 6);
  }, [favorites]);

  if (categories.length === 0) {
    return null;
  }

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <ThunderboltOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          智能分类
        </Title>
        <Text type="secondary">
          基于收藏内容自动生成的分类
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {categories.map((category) => (
          <Col xs={24} sm={12} md={8} key={category.id}>
            <Card
              hoverable
              size="small"
              style={{ 
                height: '100%',
                borderLeft: `3px solid ${category.color === 'blue' ? '#1890ff' : category.color === 'green' ? '#52c41a' : category.color === 'purple' ? '#722ed1' : category.color === 'orange' ? '#fa8c16' : category.color === 'red' ? '#ff4d4f' : '#1890ff'}`,
              }}
              onClick={() => onSelectCategory?.(category.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {category.icon}
                <Text strong style={{ fontSize: 14 }}>
                  {category.name}
                </Text>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag color={category.color} style={{ margin: 0 }}>
                  {category.count} 项
                </Tag>
                <FolderOutlined style={{ color: '#999', fontSize: 12 }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
}
