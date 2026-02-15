import { Modal, Checkbox, Input, Tag, Avatar, Space, Divider, Button, Empty, Select } from 'antd';
import { SearchOutlined, UserOutlined, FilterOutlined, CheckOutlined } from '@ant-design/icons';
import { useState, useMemo } from 'react';

interface Uploader {
  id: string;
  mid: string;
  name: string;
  avatar?: string;
  tags?: string[];
  video_count: number;
}

interface UploaderSelectorProps {
  uploaders: Uploader[];
  selectedUploaders: string[];
  onChange: (uploaderIds: string[]) => void;
}

export function UploaderSelector({ uploaders, selectedUploaders, onChange }: UploaderSelectorProps) {
  const [visible, setVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const allTags = useMemo(() => {
    return Array.from(new Set(uploaders.flatMap(u => u.tags || [])));
  }, [uploaders]);

  const filteredUploaders = useMemo(() => {
    return uploaders.filter(uploader => {
      const matchesSearch = uploader.name.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchesTag = selectedTag === 'all' || (uploader.tags || []).includes(selectedTag);
      return matchesSearch && matchesTag;
    }).sort((a, b) => b.video_count - a.video_count);
  }, [uploaders, searchKeyword, selectedTag]);

  const allSelected = selectedUploaders.length === uploaders.length;
  const someSelected = selectedUploaders.length > 0 && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onChange(uploaders.map(u => u.id));
    } else {
      onChange([]);
    }
  };

  const handleUploaderToggle = (uploaderId: string) => {
    if (selectedUploaders.includes(uploaderId)) {
      onChange(selectedUploaders.filter(id => id !== uploaderId));
    } else {
      onChange([...selectedUploaders, uploaderId]);
    }
  };

  const handleConfirm = () => {
    setVisible(false);
  };

  return (
    <>
      <Button
        icon={<UserOutlined />}
        onClick={() => setVisible(true)}
      >
        已选 {selectedUploaders.length} 个
      </Button>

      <Modal
        title="选择UP主"
        open={visible}
        onOk={handleConfirm}
        onCancel={() => setVisible(false)}
        width={700}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Input
              placeholder="搜索UP主..."
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            
            <Select
              value={selectedTag}
              onChange={setSelectedTag}
              style={{ width: 100 }}
            >
              <Select.Option value="all">全部标签</Select.Option>
              {allTags.map(tag => (
                <Select.Option key={tag} value={tag}>{tag}</Select.Option>
              ))}
            </Select>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                全选
              </Checkbox>
              <span style={{ color: '#999', fontSize: 12 }}>
                已选 {selectedUploaders.length} / {uploaders.length}
              </span>
            </div>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <div
            style={{
              maxHeight: 400,
              overflowY: 'auto',
              border: '1px solid #E8E8E8',
              borderRadius: 6,
              padding: 8
            }}
          >
            {filteredUploaders.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="没有找到匹配的UP主"
                style={{ padding: '40px 0' }}
              />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {filteredUploaders.map(uploader => {
                  const isSelected = selectedUploaders.includes(uploader.id);
                  return (
                    <div
                      key={uploader.id}
                      onClick={() => handleUploaderToggle(uploader.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: isSelected ? '#E6F7FF' : 'transparent',
                        border: isSelected ? '1px solid #1890FF' : '1px solid #E8E8E8',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#F5F5F5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {isSelected && (
                        <div style={{ 
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#1890FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <CheckOutlined style={{ fontSize: 10, color: '#FFFFFF' }} />
                        </div>
                      )}
                      
                      <Avatar
                        src={uploader.avatar}
                        icon={<UserOutlined />}
                        size={36}
                        style={{ marginRight: 10 }}
                      />
                      
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                        <div style={{ 
                          fontSize: 14, 
                          fontWeight: 500, 
                          color: '#1A1A1A',
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {uploader.name}
                        </div>
                        
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                          {(uploader.tags || []).slice(0, 2).map(tag => (
                            <Tag 
                              key={tag} 
                              style={{ margin: 0 }}
                            >
                              {tag}
                            </Tag>
                          ))}
                          {(uploader.tags || []).length > 2 && (
                            <Tag style={{ margin: 0 }}>
                              +{(uploader.tags || []).length - 2}
                            </Tag>
                          )}
                        </div>
                        
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {uploader.video_count} 个视频
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Space>
            )}
          </div>
        </Space>
      </Modal>
    </>
  );
}
