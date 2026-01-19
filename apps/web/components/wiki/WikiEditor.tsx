'use client';

import { useCallback, useEffect, useState } from 'react';
import { useProject } from '@/lib/project';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import '@tiptap/html';
import { marked } from 'marked';
import {
  createWikiPageSchema,
  updateWikiPageSchema,
  generatePath,
  type CreateWikiPageInput,
  type UpdateWikiPageInput,
  type WikiCategory,
  wikiCategories,
} from '@/lib/validations/wiki';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Note: Using native HTML for Label and Select (TODO: Add shadcn/ui components)
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * WikiEditor Component
 *
 * Rich text editor for creating and editing wiki pages with TipTap.
 * Implements compound component pattern with split view (editor left, preview right).
 *
 * @see US-018: Wiki Editor UI (8 points)
 * @see react-expert recommendations: Compound components, React.memo on preview, debounced updates
 *
 * @example
 * // New wiki page
 * <WikiEditor mode="create" onSave={handleSave} onCancel={handleCancel} />
 *
 * // Edit existing wiki page
 * <WikiEditor
 *   mode="edit"
 *   initialData={existingPage}
 *   onSave={handleUpdate}
 *   onCancel={handleCancel}
 * />
 */

interface WikiEditorProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: number;
    title: string;
    path: string;
    content: string;
    category: WikiCategory;
    excerpt?: string | null;
  };
  onSave: (data: CreateWikiPageInput | UpdateWikiPageInput) => Promise<void>;
  onCancelPath: string; // Path to redirect to on cancel
}

export function WikiEditor({ mode, initialData, onSave, onCancelPath }: WikiEditorProps) {
  const { navigateTo } = useProject();
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  // Form setup with react-hook-form + Zod validation
  const _schema = mode === 'create' ? createWikiPageSchema : updateWikiPageSchema;
  const form = useForm<CreateWikiPageInput | UpdateWikiPageInput>({
    resolver: (mode === 'create'
      ? zodResolver(createWikiPageSchema)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Resolver union types require assertion
      : zodResolver(updateWikiPageSchema)) as any,
    mode: 'onBlur', // Validate on blur for better performance
    defaultValues: {
      title: initialData?.title || '',
      path: initialData?.path || '',
      content: initialData?.content || '',
      category: initialData?.category || ('getting-started' as WikiCategory),
      excerpt: initialData?.excerpt || '',
    },
  });
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = form;

  // Watch form fields for auto-path generation and unsaved changes
  const titleValue = watch('title');
  const contentValue = watch('content');
  const pathValue = watch('path');

  // TipTap editor setup (initialize once, no dependencies array per react-expert)
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialData?.content || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none min-h-[400px] max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.getText();
      setValue('content', markdown, { shouldDirty: true });
    },
  });

  // Auto-generate path from title (only in create mode)
  useEffect(() => {
    if (mode === 'create' && titleValue && !pathValue) {
      const autoPath = generatePath(titleValue);
      setValue('path', autoPath, { shouldValidate: false });
    }
  }, [titleValue, mode, pathValue, setValue]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  // Debounce content for preview updates (500ms per react-expert)
  const debouncedContent = useDebounce(contentValue, 500);

  // Update preview when debounced content changes
  useEffect(() => {
    if (debouncedContent) {
      try {
        const html = marked.parse(debouncedContent) as string;
        setPreviewContent(html);
      } catch (error) {
        console.error('Error parsing markdown:', error);
        setPreviewContent('<p>Error parsing markdown</p>');
      }
    } else {
      setPreviewContent('');
    }
  }, [debouncedContent]);

  // Handle form submission
  const onSubmit = useCallback(
    async (data: CreateWikiPageInput | UpdateWikiPageInput) => {
      setIsSaving(true);
      try {
        await onSave(data);
        setHasUnsavedChanges(false);
        // Redirect happens in parent component
      } catch (error) {
        console.error('Error saving wiki page:', error);
        alert('Failed to save wiki page. Please try again.');
      } finally {
        setIsSaving(false);
      }
    },
    [onSave]
  );

  // Handle cancel with unsaved changes warning
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    navigateTo(onCancelPath);
  }, [hasUnsavedChanges, onCancelPath, navigateTo]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {mode === 'create' ? 'Create New Wiki Page' : 'Edit Wiki Page'}
        </h1>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Page'}
          </Button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Title */}
        <div className="md:col-span-2">
          <label htmlFor="title" className="mb-2 block text-sm font-medium">
            Title *
          </label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="title"
                placeholder="Enter wiki page title..."
                className={errors.title ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
        </div>

        {/* Path */}
        {mode === 'create' && (
          <div>
            <label htmlFor="path" className="mb-2 block text-sm font-medium">
              Path *
            </label>
            <Controller
              name="path"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="path"
                  placeholder="auto-generated-from-title"
                  className={'path' in errors ? 'border-red-500' : ''}
                />
              )}
            />
            {'path' in errors && (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Union form types require assertion for path access
              <p className="mt-1 text-sm text-red-500">{(errors as any).path?.message}</p>
            )}
          </div>
        )}
        {mode === 'edit' && (
          <div>
            <label htmlFor="path" className="mb-2 block text-sm font-medium">
              Path
            </label>
            <Input value={initialData?.path || ''} disabled className="bg-gray-100" />
            <p className="mt-1 text-sm text-gray-500">Path cannot be changed after creation</p>
          </div>
        )}

        {/* Category */}
        <div>
          <label htmlFor="category" className="mb-2 block text-sm font-medium">
            Category *
          </label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="category"
                className={`w-full rounded-md border px-3 py-2 ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
              >
                {wikiCategories.map((category) => (
                  <option key={category} value={category}>
                    {category
                      .split('-')
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.category && (
            <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>
          )}
        </div>

        {/* Excerpt (Optional) */}
        <div className="md:col-span-2">
          <label htmlFor="excerpt" className="mb-2 block text-sm font-medium">
            Excerpt (Optional)
          </label>
          <Controller
            name="excerpt"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="excerpt"
                placeholder="Brief description (max 200 characters)..."
                className={errors.excerpt ? 'border-red-500' : ''}
              />
            )}
          />
          {errors.excerpt && <p className="mt-1 text-sm text-red-500">{errors.excerpt.message}</p>}
        </div>
      </div>

      {/* Split View: Editor (Left) + Preview (Right) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Content * (Markdown)</label>
            <span className="text-sm text-gray-500">{contentValue?.length || 0} characters</span>
          </div>
          <div className="neu-raised min-h-[500px] rounded-lg border border-gray-300 bg-white p-4">
            {editor && <EditorContent editor={editor} />}
          </div>
          {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
        </div>

        {/* Preview Panel */}
        <div className="space-y-3">
          <label className="mb-2 block text-sm font-medium">Preview</label>
          <div className="neu-inset min-h-[500px] overflow-auto rounded-lg border border-gray-300 bg-gray-50 p-4">
            {previewContent ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            ) : (
              <p className="text-sm text-gray-400">Start typing to see preview...</p>
            )}
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm text-yellow-800">⚠️ You have unsaved changes</p>
        </div>
      )}
    </form>
  );
}
