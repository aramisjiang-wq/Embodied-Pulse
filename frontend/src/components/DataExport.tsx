'use client';

import { Button, Dropdown, Tooltip, App } from 'antd';
import { 
  DownloadOutlined, 
  FileExcelOutlined, 
  FileTextOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

export type ExportData = Record<string, unknown>;

export interface ExportColumn {
  key: string;
  title: string;
  formatter?: (value: unknown, row: ExportData) => string | number;
}

interface DataExportProps {
  data: ExportData[];
  columns: ExportColumn[];
  filename?: string;
  onExport?: (format: 'csv' | 'excel' | 'json') => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
}

export function DataExport({ 
  data, 
  columns, 
  filename = 'export', 
  onExport,
  loading = false,
  disabled = false,
  size = 'middle'
}: DataExportProps) {
  const { message } = App.useApp();

  const exportToCSV = async () => {
    if (data.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }

    try {
      const headers = columns.map(col => col.title).join(',');
      
      const rows = data.map(row => 
        columns.map(col => {
          const value = row[col.key];
          const formatted = col.formatter ? col.formatter(value, row) : value;
          const stringValue = String(formatted ?? '');
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      );

      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
      message.success('CSV导出成功');
      await onExport?.('csv');
    } catch (error: unknown) {
      console.error('CSV导出失败:', error);
      message.error('CSV导出失败');
    }
  };

  const exportToJSON = async () => {
    if (data.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }

    try {
      const formattedData = data.map(row => {
        const formatted: ExportData = {};
        columns.forEach(col => {
          formatted[col.title] = col.formatter ? col.formatter(row[col.key], row) : row[col.key];
        });
        return formatted;
      });

      const jsonContent = JSON.stringify(formattedData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      message.success('JSON导出成功');
      await onExport?.('json');
    } catch (error: unknown) {
      console.error('JSON导出失败:', error);
      message.error('JSON导出失败');
    }
  };

  const exportToExcel = async () => {
    if (data.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }

    try {
      const headers = columns.map(col => col.title).join('\t');
      
      const rows = data.map(row => 
        columns.map(col => {
          const value = row[col.key];
          const formatted = col.formatter ? col.formatter(value, row) : value;
          return String(formatted ?? '');
        }).join('\t')
      );

      const excelContent = [headers, ...rows].join('\n');
      const blob = new Blob(['\uFEFF' + excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xls`;
      link.click();
      URL.revokeObjectURL(url);
      
      message.success('Excel导出成功');
      await onExport?.('excel');
    } catch (error: unknown) {
      console.error('Excel导出失败:', error);
      message.error('Excel导出失败');
    }
  };

  const items: MenuProps['items'] = [
    {
      key: 'excel',
      icon: <FileExcelOutlined />,
      label: '导出Excel',
      onClick: exportToExcel,
    },
    {
      key: 'csv',
      icon: <FileTextOutlined />,
      label: '导出CSV',
      onClick: exportToCSV,
    },
    {
      key: 'json',
      icon: <FileTextOutlined />,
      label: '导出JSON',
      onClick: exportToJSON,
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']} disabled={disabled || loading}>
      <Button 
        icon={<DownloadOutlined />} 
        loading={loading}
        size={size}
      >
        导出数据
      </Button>
    </Dropdown>
  );
}

interface QuickExportProps {
  data: ExportData[];
  columns: ExportColumn[];
  filename?: string;
  format: 'csv' | 'excel' | 'json';
  onExport?: () => Promise<void>;
}

export function QuickExport({ 
  data, 
  columns, 
  filename = 'export', 
  format,
  onExport
}: QuickExportProps) {
  const { message } = App.useApp();
  const handleExport = async () => {
    if (data.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }

    try {
      const headers = columns.map(col => col.title).join(format === 'excel' ? '\t' : ',');
      
      const rows = data.map(row => 
        columns.map(col => {
          const value = row[col.key];
          const formatted = col.formatter ? col.formatter(value, row) : value;
          const stringValue = String(formatted ?? '');
          
          if (format === 'excel') {
            return stringValue;
          } else {
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }
        }).join(format === 'excel' ? '\t' : ',')
      );

      let content = '';
      let mimeType = '';
      let extension = '';

      if (format === 'json') {
        const formattedData = data.map(row => {
          const formatted: ExportData = {};
          columns.forEach(col => {
            formatted[col.title] = col.formatter ? col.formatter(row[col.key], row) : row[col.key];
          });
          return formatted;
        });
        content = JSON.stringify(formattedData, null, 2);
        mimeType = 'application/json;charset=utf-8;';
        extension = 'json';
      } else {
        content = [headers, ...rows].join('\n');
        if (format === 'excel') {
          mimeType = 'application/vnd.ms-excel;charset=utf-8;';
          extension = 'xls';
        } else {
          mimeType = 'text/csv;charset=utf-8;';
          extension = 'csv';
        }
      }

      const blob = new Blob(['\uFEFF' + content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.${extension}`;
      link.click();
      URL.revokeObjectURL(url);
      
      message.success(`${format.toUpperCase()}导出成功`);
      await onExport?.();
    } catch (error: unknown) {
      console.error(`${format.toUpperCase()}导出失败:`, error);
      message.error(`${format.toUpperCase()}导出失败`);
    }
  };

  const icon = format === 'excel' ? <FileExcelOutlined /> : 
                format === 'csv' ? <FileTextOutlined /> : <FileTextOutlined />;

  return (
    <Tooltip title={`导出${format.toUpperCase()}`}>
      <Button 
        icon={icon} 
        onClick={handleExport}
        size="small"
      >
        {format.toUpperCase()}
      </Button>
    </Tooltip>
  );
}
