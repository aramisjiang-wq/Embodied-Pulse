'use client';

import { useEffect, useState } from 'react';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import '@wangeditor/editor/dist/css/style.css';

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
  const [editor, setEditor] = useState<any>(null);

  const toolbarConfig: any = {
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
  };

  const editorConfig: any = {
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
  };

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
