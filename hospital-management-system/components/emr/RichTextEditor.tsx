'use client';

/**
 * RichTextEditor Component
 * 
 * Rich text editor for clinical notes with:
 * - Bold, italic, lists, headings
 * - Template selection and population
 * - TipTap integration
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Undo,
  Redo,
  FileText
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getNoteTemplates, NoteTemplate } from '@/lib/api/note-templates';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  showTemplateSelector?: boolean;
  templateCategory?: string;
  editable?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing your clinical note...',
  showTemplateSelector = true,
  templateCategory,
  editable = true
}: RichTextEditorProps) {
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder
      })
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4'
      }
    }
  });

  // Load templates on mount
  useEffect(() => {
    if (showTemplateSelector) {
      loadTemplates();
    }
  }, [showTemplateSelector, templateCategory]);

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await getNoteTemplates({
        is_active: true,
        category: templateCategory
      });
      setTemplates(response.templates || response.data || []);
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id.toString() === templateId);
    if (template && editor) {
      editor.commands.setContent(template.content);
      onChange(template.content);
    }
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Template Selector */}
      {showTemplateSelector && (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedTemplateId}
            onValueChange={handleTemplateSelect}
            disabled={loadingTemplates || !editable}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a template (optional)" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id.toString()}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loadingTemplates && (
            <span className="text-sm text-muted-foreground">Loading templates...</span>
          )}
        </div>
      )}

      {/* Toolbar */}
      {editable && (
        <Card className="p-2">
          <div className="flex flex-wrap gap-1">
            {/* Text Formatting */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-accent' : ''}
              disabled={!editor.can().chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-accent' : ''}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Headings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
            >
              <Heading1 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
            >
              <Heading2 className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Lists */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'bg-accent' : ''}
            >
              <List className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'bg-accent' : ''}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Undo/Redo */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
            >
              <Undo className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Editor Content */}
      <Card className="min-h-[300px]">
        <EditorContent editor={editor} />
      </Card>

      {/* Character Count */}
      <div className="text-sm text-muted-foreground text-right">
        {editor.storage.characterCount?.characters() || 0} characters
      </div>
    </div>
  );
}

/**
 * Read-only Rich Text Viewer
 * For displaying signed/finalized notes
 */
interface RichTextViewerProps {
  content: string;
}

export function RichTextViewer({ content }: RichTextViewerProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4'
      }
    }
  });

  if (!editor) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <EditorContent editor={editor} />
    </Card>
  );
}
