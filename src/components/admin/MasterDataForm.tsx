import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabaseAdmin } from '../../lib/supabase';
import { DatabaseEngine, Category, Tag } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { handleSupabaseError, showSuccessMessage, handleNetworkError } from '../../utils/apiErrorHandler';

const masterDataSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  is_active: z.boolean()
});

type MasterDataFormData = z.infer<typeof masterDataSchema>;

interface MasterDataFormProps {
  item?: DatabaseEngine | Category | Tag;
  onSuccess: (savedItem?: any) => void;
  config: {
    table: string;
    title: string;
    nameField: string;
    description: string;
  };
}

export const MasterDataForm: React.FC<MasterDataFormProps> = ({
  item,
  onSuccess,
  config
}) => {
  const isEdit = !!item;
  const { isSupabaseConnected } = useAuth();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<MasterDataFormData>({
    resolver: zodResolver(masterDataSchema),
    defaultValues: {
      name: item ? (item as any)[config.nameField] : '',
      description: item?.description || '',
      is_active: item?.is_active ?? true
    }
  });

  const onSubmit = async (data: MasterDataFormData) => {
    const itemLabel = config.title.slice(0, -1);

    // Session Mode
    if (!isSupabaseConnected) {
      await new Promise(resolve => setTimeout(resolve, 250));
      const mockResult = {
        id: item?.id || `master-${Date.now()}`,
        [config.nameField]: data.name.trim(),
        description: data.description?.trim() || '',
        is_active: data.is_active,
        created_at: item?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      showSuccessMessage(`${itemLabel} ${isEdit ? 'updated' : 'created'} (Session Mode)`);
      onSuccess(mockResult);
      return;
    }

    try {
      const payload = {
        [config.nameField]: data.name.trim(),
        description: data.description?.trim() || '',
        is_active: data.is_active
      };

      if (isEdit) {
        const { error } = await supabaseAdmin
          .from(config.table)
          .update({
            ...payload,
            updated_at: new Date().toISOString()
          })
          .eq('id', item!.id);

        if (error) {
          handleSupabaseError(error, `update ${itemLabel.toLowerCase()}`);
          return;
        }
        
        showSuccessMessage(`${itemLabel} updated successfully`);
      } else {
        const { error } = await supabaseAdmin
          .from(config.table)
          .insert(payload);

        if (error) {
          handleSupabaseError(error, `create ${itemLabel.toLowerCase()}`);
          return;
        }
        
        showSuccessMessage(`${itemLabel} created successfully`);
      }
      
      onSuccess();
    } catch {
      handleNetworkError(`${isEdit ? 'update' : 'create'} ${itemLabel.toLowerCase()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Name"
        placeholder={`Enter ${config.title.slice(0, -1).toLowerCase()} name`}
        error={errors.name?.message}
        {...register('name')}
      />

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
          Description
        </label>
        <textarea
          rows={3}
          className="block w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl shadow-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-y transition-colors"
          placeholder={`Describe the purpose and conventions for this ${config.title.slice(0, -1).toLowerCase()}...`}
          {...register('description')}
        />
      </div>

      <div className="flex items-center space-x-2.5 pt-1">
        <input
          type="checkbox"
          id="master_is_active"
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
          {...register('is_active')}
        />
        <label htmlFor="master_is_active" className="text-xs font-semibold text-slate-800 cursor-pointer">
          Active and Available in Query Selectors
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
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
          {isEdit ? `Update ${config.title.slice(0, -1)}` : `Create ${config.title.slice(0, -1)}`}
        </Button>
      </div>
    </form>
  );
};