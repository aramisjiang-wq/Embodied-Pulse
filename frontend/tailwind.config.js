/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          hover: '#3B82F6',
          active: '#1D4ED8',
          light: '#EFF6FF',
          bg: '#EFF6FF',
        },
        success: {
          DEFAULT: '#22C55E',
          hover: '#16A34A',
          light: '#F0FDF4',
        },
        warning: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
          light: '#FFFBEB',
        },
        error: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
          light: '#FEF2F2',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#EFF6FF',
        },
        text: {
          primary: '#171717',
          secondary: '#525252',
          tertiary: '#737373',
          disabled: '#A3A3A3',
          white: '#ffffff',
        },
        bg: {
          default: '#F5F5F5',
          paper: '#FFFFFF',
          elevated: '#FFFFFF',
          disabled: '#F5F5F5',
          hover: '#F5F5F5',
        },
        border: {
          DEFAULT: '#E5E5E5',
          light: '#F0F0F0',
          dark: '#D4D4D4',
        },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 8px rgba(0, 0, 0, 0.06)',
        md: '0 4px 12px rgba(0, 0, 0, 0.08)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
        xl: '0 12px 32px rgba(0, 0, 0, 0.16)',
        card: '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        xxl: '32px',
      },
      lineHeight: {
        tight: '1.35',
        normal: '1.5',
        relaxed: '1.75',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // 禁用 Tailwind 的默认样式重置，因为使用了 Ant Design
  },
};
