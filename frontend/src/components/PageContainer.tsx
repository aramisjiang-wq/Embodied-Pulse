'use client';

import { theme, Layout } from 'antd';
import { ReactNode } from 'react';

const { Content } = Layout;

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  extra?: ReactNode;
}

export default function PageContainer({ children, title, subtitle, extra }: PageContainerProps) {
  const { token } = theme.useToken();

  return (
    <Layout style={{ background: token.colorBgLayout, minHeight: '100%' }}>
      <Content style={{ padding: 24, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {(title || extra) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              {title && (
                <h1
                  style={{
                    fontSize: token.fontSizeHeading2,
                    fontWeight: 600,
                    margin: 0,
                    color: token.colorText,
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </h1>
              )}
              {subtitle && (
                <p
                  style={{
                    fontSize: token.fontSize,
                    color: token.colorTextSecondary,
                    margin: '4px 0 0',
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
            {extra && <div>{extra}</div>}
          </div>
        )}
        {children}
      </Content>
    </Layout>
  );
}
