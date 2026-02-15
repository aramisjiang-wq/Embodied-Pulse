import { Card, Row, Col, Statistic } from 'antd';
import { 
  UserOutlined, 
  VideoCameraOutlined, 
  PlayCircleOutlined, 
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { OverviewData } from '@/lib/api/analytics';
import dayjs from 'dayjs';

interface OverviewCardsProps {
  data: OverviewData;
}

export function OverviewCards({ data }: OverviewCardsProps) {
  const cards = [
    {
      title: '总UP主数',
      value: data.totalUploaders,
      icon: <UserOutlined style={{ fontSize: 20, color: '#1E40AF' }} />,
      suffix: '个',
      color: '#1E40AF',
      bgColor: '#EFF6FF'
    },
    {
      title: '总视频数',
      value: data.totalVideos,
      icon: <VideoCameraOutlined style={{ fontSize: 20, color: '#3B82F6' }} />,
      suffix: '个',
      color: '#3B82F6',
      bgColor: '#DBEAFE'
    },
    {
      title: '总播放量',
      value: formatPlayCount(data.totalPlayCount),
      icon: <PlayCircleOutlined style={{ fontSize: 20, color: '#1E40AF' }} />,
      suffix: '',
      color: '#1E40AF',
      bgColor: '#EFF6FF'
    },
    {
      title: '本月新增',
      value: data.newVideosThisMonth,
      icon: <PlusOutlined style={{ fontSize: 20, color: '#F59E0B' }} />,
      suffix: '个',
      color: '#F59E0B',
      bgColor: '#FEF3C7'
    },
    {
      title: '平均播放量',
      value: formatPlayCount(data.avgPlayCount),
      icon: <PlayCircleOutlined style={{ fontSize: 20, color: '#3B82F6' }} />,
      suffix: '',
      color: '#3B82F6',
      bgColor: '#DBEAFE'
    }
  ];

  return (
    <Row gutter={[12, 12]}>
      {cards.map((card, index) => (
        <Col xs={12} sm={12} md={8} lg={4} xl={4} key={index}>
          <Card
            style={{
              height: '100%',
              borderRadius: 8,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
              border: '1px solid #E5E7EB',
              cursor: 'pointer'
            }}
            hoverable
            bodyStyle={{ padding: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                fontSize: 13,
                color: '#6B7280',
                fontWeight: 500,
                flex: 1,
                minWidth: 0
              }}>
                {card.icon}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {card.title}
                </span>
              </div>
            </div>
            <div style={{ 
              fontSize: 28, 
              fontWeight: 700, 
              color: card.color,
              lineHeight: 1.2,
              marginBottom: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {card.value}
              {card.suffix && (
                <span style={{ 
                  fontSize: 14, 
                  fontWeight: 500, 
                  color: '#6B7280',
                  marginLeft: 4
                }}>
                  {card.suffix}
                </span>
              )}
            </div>
            <div style={{ 
              fontSize: 11, 
              color: '#9CA3AF',
              marginTop: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              数据更新于 {dayjs(data.lastUpdatedAt).format('MM-DD HH:mm')}
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

function formatPlayCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toString();
}
