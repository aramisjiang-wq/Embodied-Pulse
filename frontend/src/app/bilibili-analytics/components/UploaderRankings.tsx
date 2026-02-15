import { Empty, Avatar, Space, Progress, Tag, Select, Card, Row, Col, Statistic } from 'antd';
import { TrophyOutlined, UserOutlined, RiseOutlined, FallOutlined, CalendarOutlined } from '@ant-design/icons';
import { RankingItem } from '@/lib/api/analytics';
import { useMemo, useState } from 'react';
import dayjs from 'dayjs';

interface UploaderRankingsProps {
  data: {
    rankings: RankingItem[];
  };
  type: 'publishCount' | 'playCount' | 'avgPlayCount' | 'growthRate';
  onUploaderClick: (uploader: RankingItem) => void;
}

export function UploaderRankings({ data, type, onUploaderClick }: UploaderRankingsProps) {
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());

  const getColumnType = (currentType: typeof type) => {
    switch (currentType) {
      case 'publishCount':
        return { title: '视频数', dataIndex: 'videoCount', key: 'videoCount', unit: '个' };
      case 'playCount':
        return { title: '播放量', dataIndex: 'totalPlayCount', key: 'totalPlayCount', unit: '' };
      case 'avgPlayCount':
        return { title: '平均播放', dataIndex: 'avgPlayCount', key: 'avgPlayCount', unit: '' };
      case 'growthRate':
        return { title: '增长率', dataIndex: 'growthRate', key: 'growthRate', unit: '%' };
      default:
        return { title: '播放量', dataIndex: 'totalPlayCount', key: 'totalPlayCount', unit: '' };
    }
  };

  const { filteredRankings, availableYears, summaryStats } = useMemo(() => {
    if (!data?.rankings || data.rankings.length === 0) {
      return { filteredRankings: [], availableYears: [], summaryStats: null };
    }

    const years = Array.from(new Set(data.rankings.map(item => dayjs(item.year || new Date().toISOString()).year()))).sort((a, b) => b - a);
    
    const filtered = data.rankings.filter(item => {
      const itemYear = dayjs(item.year || new Date().toISOString()).year();
      return itemYear === selectedYear;
    });

    const mainColumn = getColumnType(type);
    const totalValue = filtered.reduce((sum, item) => sum + (item[mainColumn.dataIndex as keyof RankingItem] as number), 0);
    const avgValue = filtered.length > 0 ? totalValue / filtered.length : 0;
    const maxValue = Math.max(...filtered.map(item => item[mainColumn.dataIndex as keyof RankingItem] as number), 0);

    const summaryStats = {
      totalValue,
      avgValue,
      maxValue,
      count: filtered.length
    };

    return { filteredRankings: filtered, availableYears: years, summaryStats };
  }, [data, selectedYear, type]);

  if (!data?.rankings || data.rankings.length === 0) {
    return (
      <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="暂无数据" />
      </div>
    );
  }

  const mainColumn = getColumnType(type);
  const top10 = filteredRankings.slice(0, 10);

  const formatValue = (value: number): string => {
    if (type === 'playCount' || type === 'avgPlayCount') {
      if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
      } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
      }
      return value.toString();
    } else if (type === 'growthRate') {
      return value.toFixed(1) + '%';
    }
    return value.toString();
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#F59E0B';
    if (rank === 2) return '#9CA3AF';
    if (rank === 3) return '#B45309';
    return '#999';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const maxValue = Math.max(...top10.map(item => item[mainColumn.dataIndex as keyof RankingItem] as number));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 12, color: '#999' }}>
          <CalendarOutlined /> {selectedYear}年统计
        </div>

        {availableYears.length > 0 && (
          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            style={{ width: 100 }}
            size="small"
          >
            {availableYears.map(year => (
              <Select.Option key={year} value={year}>{year}年</Select.Option>
            ))}
          </Select>
        )}
      </div>

      {summaryStats && (
        <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card size="small" style={{ textAlign: 'center', background: '#F5F7FA', border: '1px solid #E8E8E8' }}>
              <Statistic
                title={mainColumn.title}
                value={formatValue(summaryStats.totalValue)}
                valueStyle={{ fontSize: 14, fontWeight: 600, color: '#1890FF' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" style={{ textAlign: 'center', background: '#F5F7FA', border: '1px solid #E8E8E8' }}>
              <Statistic
                title="平均"
                value={formatValue(summaryStats.avgValue)}
                valueStyle={{ fontSize: 14, fontWeight: 600, color: '#52C41A' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {top10.map((item, index) => {
            const value = item[mainColumn.dataIndex as keyof RankingItem] as number;
            const rank = index + 1;
            const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
            
            return (
              <div
                key={item.uploaderId}
                onClick={() => onUploaderClick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: '#F5F7FA',
                  border: '1px solid #E8E8E8'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#E6F7FF';
                  e.currentTarget.style.borderColor = '#1890FF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F5F7FA';
                  e.currentTarget.style.borderColor = '#E8E8E8';
                }}
              >
                <div style={{ 
                  width: 32, 
                  textAlign: 'center', 
                  fontSize: 16, 
                  fontWeight: 600,
                  color: getRankColor(rank),
                  marginRight: 12
                }}>
                  {getRankIcon(rank)}
                </div>
                
                <Avatar
                  src={item.avatar}
                  icon={<UserOutlined />}
                  size={32}
                  style={{ marginRight: 10 }}
                />
                
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 500, 
                    color: '#1A1A1A',
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.uploaderName}
                  </div>
                  
                  <Progress
                    percent={percent}
                    showInfo={false}
                    strokeColor={rank <= 3 ? '#F59E0B' : '#1890FF'}
                    size="small"
                    style={{ marginBottom: 4 }}
                  />
                </div>
                
                <div style={{ textAlign: 'right', marginLeft: 12 }}>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 600, 
                    color: '#1A1A1A',
                    marginBottom: 2
                  }}>
                    {formatValue(value)}
                  </div>
                  {type === 'growthRate' && (
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {value > 0 ? (
                        <span style={{ color: '#52C41A' }}>
                          <RiseOutlined /> 上升
                        </span>
                      ) : value < 0 ? (
                        <span style={{ color: '#FF4D4F' }}>
                          <FallOutlined /> 下降
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>持平</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </Space>
      </div>
    </div>
  );
}
