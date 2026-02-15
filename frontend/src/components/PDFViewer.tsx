'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card, Spin, Button, Space, Slider, App } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, DownloadOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  title?: string;
  width?: number;
}

export default function PDFViewer({ url, title, width }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { message } = App.useApp();

  const onDocumentLoadSuccess = useCallback(({ numPages: nextNumPages }: { numPages: number }) => {
    setNumPages(nextNumPages);
    setLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF加载错误:', error);
    setError('PDF加载失败，请稍后重试');
    setLoading(false);
    message.error('PDF加载失败');
  }, []);

  const changePage = useCallback((offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      if (newPageNumber >= 1 && newPageNumber <= numPages) {
        return newPageNumber;
      }
      return prevPageNumber;
    });
  }, [numPages]);

  const changeScale = useCallback((newScale: number) => {
    setScale(newScale);
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = url;
    link.download = title || 'document.pdf';
    link.target = '_blank';
    link.click();
    message.success('开始下载PDF');
  }, [url, title]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        changePage(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        changePage(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        changeScale(Math.min(scale + 0.1, 3));
        break;
      case 'ArrowDown':
        e.preventDefault();
        changeScale(Math.max(scale - 0.1, 0.5));
        break;
      case 'Home':
        e.preventDefault();
        setPageNumber(1);
        break;
      case 'End':
        e.preventDefault();
        setPageNumber(numPages);
        break;
    }
  }, [scale, numPages, changePage, changeScale]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (error) {
    return (
      <Card style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ color: '#ff4d4f', fontSize: 16 }}>{error}</div>
        <Button type="link" href={url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 16 }}>
          在新窗口打开PDF
        </Button>
      </Card>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <span>{title || 'PDF预览'}</span>
            <Button
              icon={<DownloadOutlined />}
              size="small"
              onClick={handleDownload}
              type="text"
            >
              下载
            </Button>
            <Button
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              size="small"
              onClick={toggleFullscreen}
              type="text"
            >
              {isFullscreen ? '退出全屏' : '全屏'}
            </Button>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ZoomOutOutlined />}
              size="small"
              onClick={() => changeScale(Math.max(scale - 0.1, 0.5))}
              disabled={scale <= 0.5}
            >
              缩小
            </Button>
            <span style={{ minWidth: 60, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
            <Button
              icon={<ZoomInOutlined />}
              size="small"
              onClick={() => changeScale(Math.min(scale + 0.1, 3))}
              disabled={scale >= 3}
            >
              放大
            </Button>
          </Space>
        }
        style={{ width: width || '100%' }}
      >
        <div style={{ marginBottom: 16 }}>
          <Slider
            min={0.5}
            max={3}
            step={0.1}
            value={scale}
            onChange={changeScale}
            marks={{
              0.5: '50%',
              1: '100%',
              1.5: '150%',
              2: '200%',
              3: '300%',
            }}
          />
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        )}

        {!loading && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Space>
                <Button
                  onClick={() => changePage(-1)}
                  disabled={pageNumber <= 1}
                  size="small"
                >
                  上一页
                </Button>
                <span>
                  第 {pageNumber} / {numPages} 页
                </span>
                <Button
                  onClick={() => changePage(1)}
                  disabled={pageNumber >= numPages}
                  size="small"
                >
                  下一页
                </Button>
              </Space>
            </div>

            <div style={{ overflow: 'auto', maxHeight: '70vh', display: 'flex', justifyContent: 'center' }}>
              <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={<Spin />}
                error={<div style={{ color: '#ff4d4f' }}>PDF加载失败</div>}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  width={width ? width * scale : undefined}
                />
              </Document>
            </div>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Space>
                <Button
                  onClick={() => changePage(-1)}
                  disabled={pageNumber <= 1}
                  size="small"
                >
                  上一页
                </Button>
                <span>
                  第 {pageNumber} / {numPages} 页
                </span>
                <Button
                  onClick={() => changePage(1)}
                  disabled={pageNumber >= numPages}
                  size="small"
                >
                  下一页
                </Button>
              </Space>
            </div>
          </>
        )}

        <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
            <strong>快捷键：</strong>
          </div>
          <div style={{ fontSize: 12, color: '#666', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
            <span>← → : 翻页</span>
            <span>↑ ↓ : 缩放</span>
            <span>Home : 第一页</span>
            <span>End : 最后一页</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
