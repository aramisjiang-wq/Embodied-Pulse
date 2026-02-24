/**
 * 统一主题配置
 * 所有颜色、间距、字体等设计变量集中管理
 */

export const theme = {
  colors: {
    primary: {
      main: '#1890ff',
      hover: '#40a9ff',
      active: '#096dd9',
      light: '#e6f7ff',
      lighter: '#f0f5ff',
      bg: '#e6f7ff',
    },
    success: {
      main: '#52c41a',
      hover: '#73d13d',
      active: '#389e0d',
      light: '#f6ffed',
      bg: '#f6ffed',
    },
    warning: {
      main: '#faad14',
      hover: '#ffc53d',
      active: '#d48806',
      light: '#fffbe6',
      bg: '#fffbe6',
    },
    error: {
      main: '#ff4d4f',
      hover: '#ff7875',
      active: '#d9363e',
      light: '#fff2f0',
      bg: '#fff2f0',
    },
    info: {
      main: '#1890ff',
      hover: '#40a9ff',
      active: '#096dd9',
      light: '#e6f7ff',
      bg: '#e6f7ff',
    },
    text: {
      primary: '#262626',
      secondary: '#595959',
      tertiary: '#8c8c8c',
      disabled: '#bfbfbf',
      white: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
      elevated: '#ffffff',
      disabled: '#f5f5f5',
    },
    border: {
      default: '#d9d9d9',
      light: '#f0f0f0',
      dark: '#8c8c8c',
    },
    divider: '#f0f0f0',
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
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 8px rgba(0, 0, 0, 0.06)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.16)',
    card: '0 2px 8px rgba(0, 0, 0, 0.08)',
    cardHover: '0 8px 24px rgba(0, 0, 0, 0.12)',
  },

  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '20px',
      xl: '24px',
      xxl: '32px',
    },
    lineHeight: {
      tight: 1.35,
      normal: 1.5,
      relaxed: 1.75,
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  breakpoints: {
    xs: '576px',
    sm: '768px',
    md: '992px',
    lg: '1200px',
    xl: '1600px',
  },

  transitions: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  layout: {
    headerHeight: '64px',
    sidebarWidth: '240px',
    adminSidebarWidth: '200px',
    contentMaxWidth: '1200px',
    mobilePadding: '12px',
    desktopPadding: '24px',
  },

  components: {
    card: {
      padding: '16px',
      borderRadius: '8px',
      shadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    button: {
      height: {
        sm: '24px',
        md: '32px',
        lg: '40px',
      },
      padding: {
        sm: '4px 15px',
        md: '8px 16px',
        lg: '12px 24px',
      },
      borderRadius: '6px',
    },
    input: {
      height: {
        sm: '24px',
        md: '32px',
        lg: '40px',
      },
      padding: {
        sm: '4px 11px',
        md: '8px 12px',
        lg: '12px 16px',
      },
      borderRadius: '6px',
    },
    table: {
      headerBg: '#fafafa',
      rowHeight: '54px',
      borderColor: '#f0f0f0',
    },
    modal: {
      padding: '24px',
      borderRadius: '8px',
    },
  },
} as const;

export type Theme = typeof theme;

export default theme;
