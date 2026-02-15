'use client';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dynamic from 'next/dynamic';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import ReactQueryProvider from '@/components/ReactQueryProvider';
import AuthProvider from '@/components/AuthProvider';

const GlobalSidebarWrapper = dynamic(() => import('@/components/GlobalSidebarWrapper'), { ssr: false });

const INDUSTRIAL_TOKEN = {
  colorPrimary: '#2563EB',
  colorBgContainer: '#FFFFFF',
  colorBgLayout: '#F5F5F5',
  colorBorder: '#E5E5E5',
  colorBorderSecondary: '#D4D4D4',
  colorText: '#171717',
  colorTextSecondary: '#525252',
  colorTextTertiary: '#737373',
  colorTextQuaternary: '#A3A3A3',
  borderRadius: 4,
  borderRadiusLG: 4,
  borderRadiusSM: 2,
  controlHeight: 40,
  controlHeightLG: 48,
  controlHeightSM: 32,
  fontSize: 16,
  fontSizeLG: 18,
  fontSizeSM: 14,
  fontSizeHeading1: 36,
  fontSizeHeading2: 28,
  fontSizeHeading3: 22,
  fontSizeHeading4: 18,
  lineHeight: 1.6,
  margin: 16,
  marginLG: 24,
  marginSM: 8,
  padding: 16,
  paddingLG: 24,
  paddingSM: 8,
};

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AntdRegistry>
      <ConfigProvider 
        locale={zhCN} 
        theme={{
          token: INDUSTRIAL_TOKEN,
          components: {
            Button: {
              borderRadius: 4,
              controlHeight: 44,
              primaryShadow: 'none',
              defaultShadow: 'none',
              dangerShadow: 'none',
              fontSize: 16,
            },
            Card: {
              borderRadiusLG: 4,
              boxShadow: 'none',
              boxShadowTertiary: 'none',
              fontSize: 16,
            },
            Input: {
              borderRadius: 4,
              controlHeight: 44,
              fontSize: 16,
            },
            Select: {
              borderRadius: 4,
              controlHeight: 44,
              fontSize: 16,
            },
            Tag: {
              borderRadiusSM: 2,
              fontSize: 14,
            },
            Modal: {
              borderRadiusLG: 4,
              fontSize: 16,
            },
            Tabs: {
              borderRadiusLG: 4,
              fontSize: 16,
            },
            Pagination: {
              borderRadius: 4,
              fontSize: 16,
            },
            Dropdown: {
              borderRadiusLG: 4,
              fontSize: 16,
            },
            Menu: {
              fontSize: 16,
            },
            Table: {
              fontSize: 16,
            },
            Form: {
              fontSize: 16,
              labelFontSize: 16,
            },
          },
        }}
      >
        <ReactQueryProvider>
          <App>
            <ServiceWorkerRegister />
            <AuthProvider>
              <GlobalSidebarWrapper>
                {children}
              </GlobalSidebarWrapper>
            </AuthProvider>
          </App>
        </ReactQueryProvider>
      </ConfigProvider>
    </AntdRegistry>
  );
}
