'use client';

import { useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['code-block', 'blockquote'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'font',
  'list', 'bullet',
  'align',
  'link', 'image',
  'code-block', 'blockquote'
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容...',
  height = 500,
  disabled = false,
}: RichTextEditorProps) {
  const modulesConfig = useMemo(() => modules, []);
  
  const handleChange = (content: string) => {
    onChange?.(content);
  };

  return (
    <div style={{ 
      border: '1px solid #d9d9d9', 
      borderRadius: 6,
      overflow: 'hidden'
    }}>
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={handleChange}
        modules={modulesConfig}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        style={{ 
          height: height - 52,
          marginBottom: 44
        }}
      />
      <style jsx global>{`
        .ql-container {
          font-size: 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid #d9d9d9 !important;
          background: #fafafa;
        }
        .ql-container.ql-snow {
          border: none !important;
        }
        .ql-editor {
          min-height: ${height - 100}px;
        }
        .ql-editor.ql-blank::before {
          color: #bfbfbf;
          font-style: normal;
        }
        .ql-snow .ql-stroke {
          stroke: #595959;
        }
        .ql-snow .ql-fill {
          fill: #595959;
        }
        .ql-snow .ql-picker {
          color: #595959;
        }
        .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-label {
          border-color: #d9d9d9;
        }
        .ql-toolbar.ql-snow .ql-picker-options {
          border-color: #d9d9d9;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .ql-snow.ql-toolbar button:hover,
        .ql-snow .ql-toolbar button:hover,
        .ql-snow.ql-toolbar button:focus,
        .ql-snow .ql-toolbar button:focus,
        .ql-snow.ql-toolbar button.ql-active,
        .ql-snow .ql-toolbar button.ql-active {
          color: #1890ff;
        }
        .ql-snow.ql-toolbar button:hover .ql-stroke,
        .ql-snow .ql-toolbar button:hover .ql-stroke,
        .ql-snow.ql-toolbar button:focus .ql-stroke,
        .ql-snow .ql-toolbar button:focus .ql-stroke,
        .ql-snow.ql-toolbar button.ql-active .ql-stroke,
        .ql-snow .ql-toolbar button.ql-active .ql-stroke {
          stroke: #1890ff;
        }
        .ql-snow.ql-toolbar button:hover .ql-fill,
        .ql-snow .ql-toolbar button:hover .ql-fill,
        .ql-snow.ql-toolbar button:focus .ql-fill,
        .ql-snow .ql-toolbar button:focus .ql-fill,
        .ql-snow.ql-toolbar button.ql-active .ql-fill,
        .ql-snow .ql-toolbar button.ql-active .ql-fill {
          fill: #1890ff;
        }
      `}</style>
    </div>
  );
}
