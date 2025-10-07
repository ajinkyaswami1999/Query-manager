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
  type: string;
  item?: DatabaseEngine | Category | Tag;
  onSuccess: () => void;
  config: {
    table: string;
    title: string;
    nameField: string;
    description: string;
  };
}

export const MasterDataForm: React.FC<MasterDataFormProps> = ({
  type,
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
    if (!isSupabaseConnected) {
      handleSupabaseError({ message: 'Master data management not available in demo mode' }, 'manage master data');
      return;
    }

    try {
      const payload = {
        [config.nameField]: data.name,
        description: data.description || '',
        is_active: data.is_active
      };

      if (isEdit) {
        // Use service role to bypass RLS
        const { error } = await supabaseAdmin
          .from(config.table)
          .update({
            ...payload,
            updated_at: new Date().toISOString()
          })
          .eq('id', item!.id);

        if (error) {
          handleSupabaseError(error, `update ${config.title.slice(0, -1).toLowerCase()}`);
          return;
        }
        
        showSuccessMessage(`${config.title.slice(0, -1)} updated successfully`);
      } else {
        // Use service role to bypass RLS
        const { error } = await supabaseAdmin
          .from(config.table)
          .insert(payload);

        if (error) {
          handleSupabaseError(error, `create ${config.title.slice(0, -1).toLowerCase()}`);
          return;
        }
        
        showSuccessMessage(`${config.title.slice(0, -1)} created successfully`);
      }
      
      onSuccess();
    } catch (error: any) {
      handleNetworkError(`${isEdit ? 'update' : 'create'} ${config.title.slice(0, -1).toLowerCase()}`);
    }
  };

  return (
    <div className="space-y-4">
      {!isSupabaseConnected && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-amber-800">
            Master data management is not available in demo mode. Connect to Supabase to enable this feature.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Name"
          placeholder={`Enter ${config.title.slice(0, -1).toLowerCase()} name`}
          error={errors.name?.message}
          disabled={!isSupabaseConnected}
          {...register('name')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:shadow-md resize-y"
            placeholder={`Describe this ${config.title.slice(0, -1).toLowerCase()}...`}
            disabled={!isSupabaseConnected}
            {...register('description')}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-md"
            disabled={!isSupabaseConnected}
            {...register('is_active')}
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!isSupabaseConnected}
          >
            {isEdit ? `Update ${config.title.slice(0, -1)}` : `Create ${config.title.slice(0, -1)}`}
          </Button>
        </div>
      </form>
    </div>
  );
};