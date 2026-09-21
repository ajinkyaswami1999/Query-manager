import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Code2, Eye } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { SqlHighlighter } from '../ui/SqlHighlighter';
import { useAuth } from '../../hooks/useAuth';
import { supabaseAdmin } from '../../lib/supabase';
import { Query, DatabaseEngine, Category, Tag } from '../../types';
import { handleSupabaseError, showSuccessMessage, handleNetworkError } from '../../utils/apiErrorHandler';

const querySchema = z.object({
  query_name: z.string().min(1, 'Query name is required'),
  query_text: z.string().min(1, 'Query text is required'),
  description: z.string().optional(),
  engine_id: z.string().optional(),
  category_id: z.string().optional(),
  tag_id: z.string().optional(),
  is_shared: z.boolean().optional()
});

type QueryFormData = z.infer<typeof querySchema>;

interface QueryFormProps {
  query?: Query;
  onSuccess: (savedQuery?: Query) => void;
  engines: DatabaseEngine[];
  categories: Category[];
  tags: Tag[];
}

export const QueryForm: React.FC<QueryFormProps> = ({
  query,
  onSuccess,
  engines,
  categories,
  tags
}) => {
  const { user, hasRight, isSupabaseConnected } = useAuth();
  const isEdit = !!query;
  const [activeEditorTab, setActiveEditorTab] = useState<'write' | 'preview'>('write');

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<QueryFormData>({
    resolver: zodResolver(querySchema),
    defaultValues: {
      query_name: query?.query_name || '',
      query_text: query?.query_text || '',
      description: query?.description || '',
      engine_id: query?.engine_id || '',
      category_id: query?.category_id || '',
      tag_id: query?.tag_id || '',
      is_shared: query?.is_shared ?? false
    }
  });

  const queryText = watch('query_text') || '';

  const onSubmit = async (data: QueryFormData) => {
    try {
      const selectedEngine = engines.find(e => e.id === data.engine_id);
      const selectedCategory = categories.find(c => c.id === data.category_id);
      const selectedTag = tags.find(t => t.id === data.tag_id);

      // Demo Mode Session Support
      if (!isSupabaseConnected) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const mockResult: Query = {
          id: query?.id || `query-demo-${Date.now()}`,
          query_name: data.query_name.trim(),
          query_text: data.query_text.trim(),
          description: data.description?.trim() || '',
          engine_id: data.engine_id || null,
          category_id: data.category_id || null,
          tag_id: data.tag_id || null,
          is_shared: data.is_shared || false,
          created_by: user?.user.id || 'admin-1',
          updated_by: isEdit ? (user?.user.id || 'admin-1') : null,
          created_at: query?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          engine: selectedEngine,
          category: selectedCategory,
          tag: selectedTag,
          creator: {
            id: user?.user.id || 'admin-1',
            role_id: user?.role?.id || null,
            name: user?.user.name || 'Admin',
            email: user?.user.email || 'admin@example.com',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        };

        showSuccessMessage(`Query ${isEdit ? 'updated' : 'created'} successfully (Session Mode)`);
        onSuccess(mockResult);
        return;
      }

      // Enhanced validation
      if (!user?.user?.id) {
        handleSupabaseError({ message: 'Authentication required. Please log in again' }, 'create/update query');
        return;
      }

      if (!data.query_name.trim()) {
        handleSupabaseError({ message: 'Query name is required' }, 'validate query');
        return;
      }
      
      if (!data.query_text.trim()) {
        handleSupabaseError({ message: 'Query text is required' }, 'validate query');
        return;
      }

      const queryData = {
        query_name: data.query_name.trim(),
        query_text: data.query_text.trim(),
        description: data.description?.trim() || '',
        engine_id: data.engine_id || null,
        category_id: data.category_id || null,
        tag_id: data.tag_id || null,
        is_shared: data.is_shared || false,
      };

      if (isEdit) {
        if (!query?.id) {
          handleSupabaseError({ message: 'Query ID missing. Cannot update query' }, 'update query');
          return;
        }

        const { error } = await supabaseAdmin
          .from('queries')
          .update({
            ...queryData,
            updated_by: user.user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', query.id);

        if (error) {
          handleSupabaseError(error, 'update query');
          return;
        }
        
        showSuccessMessage('Query updated successfully');
        onSuccess();
      } else {
        const { data: insertData, error } = await supabaseAdmin
          .from('queries')
          .insert({
            ...queryData,
            id: crypto.randomUUID(),
            created_by: user.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          handleSupabaseError(error, 'create query');
          return;
        }

        if (!insertData) {
          handleSupabaseError({ message: 'Query creation failed: No data returned from database' }, 'create query');
          return;
        }
        
        showSuccessMessage('Query created successfully');
        onSuccess();
      }
    } catch {
      handleNetworkError(`${isEdit ? 'update' : 'create'} query`);
    }
  };

  const canShareQuery = hasRight('SHARE_QUERY');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Title */}
      <Input
        label="Query Name"
        placeholder="e.g., MTD Revenue Performance by Region"
        error={errors.query_name?.message}
        {...register('query_name')}
      />

      {/* SQL Code Area with Write / Preview Tabs */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            SQL Query Content
          </label>
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveEditorTab('write')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                activeEditorTab === 'write'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveEditorTab('preview')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                activeEditorTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {activeEditorTab === 'write' ? (
          <div className="relative">
            <textarea
              rows={11}
              className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-inner font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-y leading-relaxed"
              placeholder="SELECT&#10;  customer_id,&#10;  COUNT(*) as total_orders,&#10;  SUM(amount) as revenue&#10;FROM orders&#10;GROUP BY customer_id;&#10;"
              {...register('query_text')}
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
              <span>Standard ANSI / PostgreSQL syntax</span>
              <span>{queryText.length} characters · {queryText.split('\n').length} lines</span>
            </div>
          </div>
        ) : (
          <div className="min-h-[220px]">
            {queryText.trim() ? (
              <SqlHighlighter
                code={queryText}
                showLineNumbers
                showCopyButton
                className="min-h-[220px]"
              />
            ) : (
              <div className="h-56 bg-slate-950 rounded-xl flex items-center justify-center text-slate-500 font-mono text-xs border border-slate-800">
                Type SQL in the Editor tab to see syntax-highlighted preview
              </div>
            )}
          </div>
        )}

        {errors.query_text && (
          <p className="text-xs text-rose-600 font-medium">{errors.query_text.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
          Description
        </label>
        <textarea
          rows={2}
          className="block w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl shadow-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
          placeholder="Explain the purpose, parameters, and expected output of this query..."
          {...register('description')}
        />
      </div>

      {/* Metadata Selectors: Engine, Category, Tag */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Database Engine
          </label>
          <select
            className="block w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl shadow-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            {...register('engine_id')}
          >
            <option value="">Select Engine</option>
            {engines.map(engine => (
              <option key={engine.id} value={engine.id}>
                {engine.engine_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Category
          </label>
          <select
            className="block w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl shadow-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            {...register('category_id')}
          >
            <option value="">Select Category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.category_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Tag
          </label>
          <select
            className="block w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl shadow-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            {...register('tag_id')}
          >
            <option value="">Select Tag</option>
            {tags.map(tag => (
              <option key={tag.id} value={tag.id}>
                {tag.tag_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sharing Option */}
      {canShareQuery && (
        <div className="flex items-center space-x-3 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <input
            type="checkbox"
            id="is_shared"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
            {...register('is_shared')}
          />
          <label htmlFor="is_shared" className="text-xs font-medium text-slate-800 cursor-pointer">
            Make this query shared with all team members
          </label>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onSuccess()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={isSubmitting}
        >
          {isEdit ? 'Update Query' : 'Save Query'}
        </Button>
      </div>
    </form>
  );
};