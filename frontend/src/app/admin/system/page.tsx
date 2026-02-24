'use client';

import { Card, Row, Col, Typography, Space, Button } from 'antd';
import { Link } from 'next/link';
import {
  WarningOutlined, HeartOutlined, FileTextOutlined, ApiOutlined,
  SettingOutlined
} from '@ant-design/icons';
import PageContainer from '@/components/PageContainer';
import styles from './page.module.css';

const { Title, Text } = Typography;

const systemModules = [
  {
    key: 'health',
    title: '系统健康',
    description: '监控系统各组件运行状态',
    icon: <HeartOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
    href: '/admin/system/health',
  },
  {
    key: 'tech-debt',
    title: '技术债务',
    description: '跟踪和管理技术债务',
    icon: <WarningOutlined style={{ fontSize: 32, color: '#faad14' }} />,
    href: '/admin/system/tech-debt',
  },
];

export default function SystemManagePage() {
  return (
    <PageContainer title="系统管理">
      <div className={styles.container}>
        <Row gutter={[16, 16]}>
          {systemModules.map((module) => (
            <Col span={8} key={module.key}>
              <Card
                hoverable
                className={styles.moduleCard}
                onClick={() => window.location.href = module.href}
              >
                <div className={styles.moduleContent}>
                  <div className={styles.moduleIcon}>{module.icon}</div>
                  <Title level={4}>{module.title}</Title>
                  <Text type="secondary">{module.description}</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </PageContainer>
  );
}
