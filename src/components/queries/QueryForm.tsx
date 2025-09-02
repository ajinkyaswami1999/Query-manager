import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { supabaseAdmin } from '../../lib/supabase';
import { Query, DatabaseEngine, Category, Tag } from '../../types';
import toast from 'react-hot-toast';

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

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<QueryFormData>({
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
        toast.success(`Query ${isEdit ? 'updated' : 'created'} successfully (Demo Mode)`);
        onSuccess();
        return;
      }

      // Validate user is logged in
      if (!user?.user.id) {
        toast.error('User not authenticated. Please log in again.');
        return;
      }

      const queryData = {
        ...data,
        engine_id: data.engine_id || null,
        category_id: data.category_id || null,
        tag_id: data.tag_id || null,
      };

      if (isEdit) {
        if (!query?.id) {
          toast.error('Query ID not found. Cannot update.');
          return;
        }

        // Use service role to bypass RLS for updates
        const { error } = await supabaseAdmin
          .from('queries')
          .update({
            ...queryData,
            updated_by: user?.user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', query.id);

        if (error) {
          console.error('Error updating query:', error);
          if (error.code === 'PGRST301') {
            toast.error('Access denied: insufficient permissions to update this query');
          } else if (error.code === 'PGRST116') {
            toast.error('Query not found');
          } else if (error.code === '23505') {
            toast.error('A query with this name already exists');
          } else if (error.code === '23503') {
            toast.error('Invalid reference data selected (engine, category, or tag)');
          } else {
            toast.error(`Failed to update query: ${error.message}`);
          }
          return;
        }
        
        toast.success('Query updated successfully');
      } else {
        // Validate required fields for creation
        if (!queryData.query_name.trim()) {
          toast.error('Query name is required');
          return;
        }
        if (!queryData.query_text.trim()) {
          toast.error('Query text is required');
          return;
        }

        // Use service role to bypass RLS for inserts
        const { data: insertData, error } = await supabaseAdmin
          .from('queries')
          .insert({
            ...queryData,
            created_by: user.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating query:', error);
          if (error.code === '23505') {
            toast.error('A query with this name already exists');
          } else if (error.code === '23503') {
            toast.error('Invalid reference data selected (engine, category, or tag)');
          } else if (error.code === 'PGRST301') {
            toast.error('Access denied: insufficient permissions to create query');
          } else if (error.code === '42501') {
            toast.error('Database permission error. Please contact administrator.');
          } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
            toast.error('Database schema incomplete. Please run migrations.');
          } else {
            toast.error(`Failed to create query: ${error.message}`);
          }
          return;
        }

        if (!insertData) {
          toast.error('Query creation failed: No data returned');
          return;
        }
        
        toast.success('Query created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving query:', error);
      toast.error(`Network error: Failed to ${isEdit ? 'update' : 'create'} query`);
    }
  };

  const canShareQuery = hasRight('SHARE_QUERY');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Query Name"
        placeholder="Enter query name"
        error={errors.query_name?.message}
        {...register('query_name')}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Query Text
        </label>
        <textarea
          rows={8}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          placeholder="SELECT * FROM users WHERE..."
          {...register('query_text')}
        />
        {errors.query_text && (
          <p className="text-sm text-red-600 mt-1">{errors.query_text.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe what this query does..."
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Database Engine
          </label>
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tag
          </label>
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_shared"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            {...register('is_shared')}
          />
          <label htmlFor="is_shared" className="text-sm font-medium text-gray-700">
            Share this query with other users
          </label>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="submit"
          loading={isSubmitting}
        >
          {isEdit ? 'Update Query' : 'Create Query'}
        </Button>
      </div>
    </form>
  );
};