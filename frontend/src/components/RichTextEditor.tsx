'use client';

import { useEffect, useState, useMemo } from 'react';
import { Spin } from 'antd';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '请输入内容...',
  height = 400,
  disabled = false,
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [EditorComponent, setEditorComponent] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    import('@wangeditor/editor-for-react').then((mod) => {
      setEditorComponent(() => mod.default);
    });
  }, []);

  const toolbarConfig = useMemo(() => ({
    toolbarKeys: [
      'headerSelect',
      '|',
      'bold',
      'italic',
      'underline',
      'through',
      '|',
      'color',
      'bgColor',
      '|',
      'fontSize',
      'fontFamily',
      '|',
      'bulletedList',
      'numberedList',
      'justifyLeft',
      'justifyCenter',
      'justifyRight',
      '|',
      'emotion',
      'insertLink',
      '|',
      'insertImage',
      '|',
      'insertTable',
      'codeBlock',
      'blockquote',
      'divider',
      '|',
      'undo',
      'redo',
      '|',
      'fullScreen',
    ],
  }), []);

  const editorConfig = useMemo(() => ({
    placeholder,
    MENU_CONF: {
      uploadImage: {
        fieldName: 'file',
        server: '/api/v1/upload',
        maxFileSize: 5 * 1024 * 1024,
        allowedFileTypes: ['image/*'],
        onError: (file: File, err: any) => {
          console.error('图片上传失败', err);
        },
      },
    },
  }), [placeholder]);

  if (!mounted || !EditorComponent) {
    return (
      <div style={{ 
        border: '1px solid #d9d9d9', 
        borderRadius: 6, 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Spin tip="加载编辑器..." />
      </div>
    );
  }

  return (
    <RichTextEditorInner
      EditorComponent={EditorComponent}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      height={height}
      disabled={disabled}
      toolbarConfig={toolbarConfig}
      editorConfig={editorConfig}
    />
  );
}

function RichTextEditorInner({
  EditorComponent,
  value,
  onChange,
  placeholder,
  height,
  disabled,
  toolbarConfig,
  editorConfig,
}: {
  EditorComponent: any;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  toolbarConfig: any;
  editorConfig: any;
}) {
  const [editor, setEditor] = useState<any>(null);

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  const handleChange = (editor: any) => {
    const html = editor.getHtml();
    onChange?.(html);
  };

  const { Editor, Toolbar } = EditorComponent;

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
      <Toolbar
        editor={editor}
        defaultConfig={toolbarConfig}
        mode="default"
        style={{ borderBottom: '1px solid #d9d9d9' }}
      />
      <Editor
        defaultConfig={editorConfig}
        defaultHtml={value || ''}
        onCreated={setEditor}
        onChange={handleChange}
        mode="default"
        style={{ height, overflowY: 'hidden' }}
      />
    </div>
  );
}
