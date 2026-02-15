import { useState, useEffect, useRef, useCallback } from 'react';
import { List, Tag } from 'antd';
import { HistoryOutlined, FireOutlined } from '@ant-design/icons';
import { searchUtils, SearchHistoryItem } from '@/lib/utils/searchUtils';

interface SearchSuggestionsProps {
  keyword: string;
  visible: boolean;
  onSelect: (keyword: string) => void;
  onClose: () => void;
}

export default function SearchSuggestions({ keyword, visible, onSelect, onClose }: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadSuggestions = useCallback(async () => {
    const searchHistory = searchUtils.getSearchHistory();
    setHistory(searchHistory);
    const suggestionList = await searchUtils.generateSuggestions(keyword, searchHistory);
    setSuggestions(suggestionList);
  }, [keyword]);

  const handleSelect = (suggestion: string) => {
    searchUtils.addSearchHistory(suggestion);
    onSelect(suggestion);
    onClose();
  };

  const handleClearHistory = () => {
    searchUtils.clearSearchHistory();
    setHistory([]);
    loadSuggestions();
  };

  useEffect(() => {
    if (visible && keyword) {
      loadSuggestions();
    }
  }, [visible, keyword, loadSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const historyItems = history.filter(item => 
    item.keyword.toLowerCase().includes(keyword.toLowerCase())
  ).slice(0, 5);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        maxHeight: 400,
        overflowY: 'auto',
      }}
    >
      {historyItems.length > 0 && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#999', fontWeight: 500 }}>
              <HistoryOutlined style={{ marginRight: 4 }} />
              搜索历史
            </span>
            <button
              onClick={handleClearHistory}
              style={{
                border: 'none',
                background: 'none',
                color: '#999',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              清除
            </button>
          </div>
          <List
            size="small"
            dataSource={historyItems}
            renderItem={(item) => (
              <List.Item
                style={{ cursor: 'pointer', padding: '8px 0' }}
                onClick={() => handleSelect(item.keyword)}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#333' }}>{item.keyword}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                    {new Date(item.timestamp).toLocaleString('zh-CN')}
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      )}

      {suggestions.length > 0 && (
        <div style={{ padding: '8px 12px' }}>
          <span style={{ fontSize: 12, color: '#999', fontWeight: 500, marginBottom: 8, display: 'block' }}>
            <FireOutlined style={{ marginRight: 4 }} />
            热门推荐
          </span>
          <List
            size="small"
            dataSource={suggestions}
            renderItem={(suggestion) => (
              <List.Item
                style={{ cursor: 'pointer', padding: '8px 0' }}
                onClick={() => handleSelect(suggestion)}
                onMouseDown={(e) => e.preventDefault()}
              >
                <Tag color="blue" style={{ margin: 0 }}>
                  {suggestion}
                </Tag>
              </List.Item>
            )}
          />
        </div>
      )}

      {historyItems.length === 0 && suggestions.length === 0 && keyword.length >= 2 && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#999', fontSize: 13 }}>
          暂无相关建议
        </div>
      )}
    </div>
  );
}
