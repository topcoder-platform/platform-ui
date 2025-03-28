// src/apps/review/components/markdown-editor.tsx
import React, { useRef, useState } from 'react';
import { Editor, Viewer } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import { Button } from '@/components/ui/button';

interface MarkdownEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  placeholder?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  initialValue = '',
  onChange,
  onBlur,
  readOnly = false,
  height = '300px',
  placeholder = 'Write your comments here...'
}) => {
  const editorRef = useRef<Editor>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleChange = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.getInstance().getMarkdown());
    }
  };

  const handleBlur = () => {
    if (editorRef.current && onBlur) {
      onBlur(editorRef.current.getInstance().getMarkdown());
    }
  };

  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  if (readOnly) {
    return (
      <div className="border rounded p-2">
        <Viewer initialValue={initialValue} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={togglePreviewMode}
        >
          {isPreviewMode ? 'Edit' : 'Preview'}
        </Button>
      </div>
      {isPreviewMode ? (
        <Viewer initialValue={initialValue} />
      ) : (
        <Editor
          ref={editorRef}
          initialValue={initialValue}
          previewStyle="vertical"
          height={height}
          initialEditType="markdown"
          useCommandShortcut={true}
          placeholder={placeholder}
          onChange={handleChange}
          onBlur={handleBlur}
          toolbarItems={[
            ['heading', 'bold', 'italic', 'strike'],
            ['hr', 'quote'],
            ['ul', 'ol', 'task', 'indent', 'outdent'],
            ['table', 'image', 'link'],
            ['code', 'codeblock']
          ]}
        />
      )}
    </div>
  );
};
