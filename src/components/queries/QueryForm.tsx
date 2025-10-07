import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
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
  onSuccess: () => void;
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

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<QueryFormData>({
    resolver: zodResolver(querySchema),
    defaultValues: {
      query_name: query?.query_name || '',
      query_text: query?.query_text || '',
      description: query?.description || '',
      engine_id: query?.engine_id || '',
      category_id: query?.category_id || '',
      tag_id: query?.tag_id || '',
      is_shared: query?.is_shared || false
    }
  });

  const onSubmit = async (data: QueryFormData) => {
    try {
      if (!isSupabaseConnected) {
        // Simulate successful creation in demo mode
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        toast.success(`Query ${isEdit ? 'updated' : 'created'} successfully (Demo Mode)`);
        onSuccess();
        return;
      }

      // Enhanced validation
      if (!user?.user?.id) {
        handleSupabaseError({ message: 'Authentication required. Please log in again' }, 'create/update query');
        return;
      }

      // Client-side validation
      if (!data.query_name.trim()) {
        handleSupabaseError({ message: 'Query name is required' }, 'validate query');
        return;
      }
      
      if (!data.query_text.trim()) {
        handleSupabaseError({ message: 'Query text is required' }, 'validate query');
        return;
      }

      // Prepare data for submission
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
        // Validate query exists for editing
        if (!query?.id) {
          handleSupabaseError({ message: 'Query ID missing. Cannot update query' }, 'update query');
          return;
        }

        // Update query using service role to bypass RLS
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
      } else {
        // Create new query using service role to bypass RLS
        const { data: insertData, error } = await supabaseAdmin
          .from('queries')
          .insert({
            ...queryData,
            id: crypto.randomUUID(), // Generate UUID for new query
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
      }
      
      onSuccess();
    } catch (error) {
      handleNetworkError(`${isEdit ? 'update' : 'create'} query`);
    }
  };

  const canShareQuery = hasRight('SHARE_QUERY');

  return (
    <div className="bounce-in">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Query Name"
          placeholder="Enter query name"
          error={errors.query_name?.message}
          {...register('query_name')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SQL Query
          </label>
          <textarea
            rows={12}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y glow-on-hover transition-all duration-300"
            placeholder="SELECT * FROM users WHERE..."
            {...register('query_text')}
          />
          {errors.query_text && (
            <p className="text-sm text-red-600 mt-1">{errors.query_text.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            rows={3}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y glow-on-hover transition-all duration-300"
            placeholder="Describe what this query does..."
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Database Engine
            </label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent glow-on-hover transition-all duration-300"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent glow-on-hover transition-all duration-300"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tag
            </label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent glow-on-hover transition-all duration-300"
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

        {canShareQuery && (
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="is_shared"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-300"
              {...register('is_shared')}
            />
            <label htmlFor="is_shared" className="text-sm font-medium text-gray-700">
              Share this query with other users
            </label>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onSuccess()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            className="pulse-glow"
          >
            {isEdit ? 'Update Query' : 'Create Query'}
          </Button>
        </div>
      </form>
    </div>
  );
};