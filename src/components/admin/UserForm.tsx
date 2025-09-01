import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabaseAdmin } from '../../lib/supabase';
import { User, Role, UserRight } from '../../types';
import { validatePassword } from '../../utils/validation';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  role_id: z.string().min(1, 'Role is required'),
  is_active: z.boolean(),
  rights: z.array(z.string()).optional()
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  user?: User;
  onSuccess: () => void;
  roles: Role[];
  userRights: UserRight[];
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSuccess,
  roles,
  userRights
}) => {
  const isEdit = !!user;
  const [selectedRights, setSelectedRights] = React.useState<string[]>([]);
  const { isSupabaseConnected } = useAuth();

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role_id: user?.role_id || '',
      is_active: user?.is_active ?? true
    }
  });

  const password = watch('password');

  React.useEffect(() => {
    if (user && isSupabaseConnected) {
      loadUserRights();
    }
  }, [user, isSupabaseConnected]);

  const loadUserRights = async () => {
    if (!user || !isSupabaseConnected) return;

    try {
      // Use service role to bypass RLS
      const { data, error } = await supabaseAdmin
        .from('user_role_rights')
        .select('right_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading user rights:', error);
        return;
      }

      const rightIds = data.map(r => r.right_id);
      setSelectedRights(rightIds);
    } catch (error) {
      console.error('Error loading user rights:', error);
    }
  };

  const handleRightChange = (rightId: string, checked: boolean) => {
    if (checked) {
      setSelectedRights([...selectedRights, rightId]);
    } else {
      setSelectedRights(selectedRights.filter(id => id !== rightId));
    }
  };

  const onSubmit = async (data: UserFormData) => {
    if (!isSupabaseConnected) {
      toast.error('User management not available in demo mode');
      return;
    }

    if (!isEdit && data.password) {
      const validation = validatePassword(data.password);
      if (!validation.isValid) {
        toast.error(`Password validation failed: ${validation.errors.join(', ')}`);
        return;
      }
    }

    try {
      if (isEdit) {
        // Update user using service role
        const updateData: any = {
          name: data.name,
          email: data.email,
          role_id: data.role_id,
          is_active: data.is_active,
          updated_at: new Date().toISOString()
        };

        if (data.password) {
          updateData.password_hash = data.password;
        }

        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('id', user!.id);

        if (updateError) {
          console.error('Error updating user:', updateError);
          if (updateError.code === '23505') {
            toast.error('A user with this email already exists');
          } else if (updateError.code === '23503') {
            toast.error('Invalid role selected');
          } else {
            toast.error('Failed to update user');
          }
          return;
        }

        // Update user rights using service role
        const { error: deleteRightsError } = await supabaseAdmin
          .from('user_role_rights')
          .delete()
          .eq('user_id', user!.id);

        if (deleteRightsError) {
          console.error('Error deleting old user rights:', deleteRightsError);
        }

        if (selectedRights.length > 0) {
          const rightsData = selectedRights.map(rightId => ({
            user_id: user!.id,
            right_id: rightId
          }));

          const { error: rightsError } = await supabaseAdmin
            .from('user_role_rights')
            .insert(rightsData);

          if (rightsError) {
            console.error('Error inserting user rights:', rightsError);
            toast.error('User updated but failed to assign rights');
            return;
          }
        }

        toast.success('User updated successfully');
      } else {
        // Create user using service role
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            name: data.name,
            email: data.email,
            password_hash: data.password!,
            role_id: data.role_id,
            is_active: data.is_active
          })
          .select()
          .single();

        if (userError) {
          console.error('Error creating user:', userError);
          if (userError.code === '23505') {
            toast.error('A user with this email already exists');
          } else if (userError.code === '23503') {
            toast.error('Invalid role selected');
          } else {
            toast.error('Failed to create user');
          }
          return;
        }

        // Add user rights using service role
        if (selectedRights.length > 0) {
          const rightsData = selectedRights.map(rightId => ({
            user_id: userData.id,
            right_id: rightId
          }));

          const { error: rightsError } = await supabaseAdmin
            .from('user_role_rights')
            .insert(rightsData);

          if (rightsError) {
            console.error('Error inserting user rights:', rightsError);
            toast.error('User created but failed to assign rights');
            return;
          }
        }

        toast.success('User created successfully');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} user`);
    }
  };

  const passwordValidation = password ? validatePassword(password) : { isValid: true, errors: [] };

  return (
    <div className="space-y-4">
      {!isSupabaseConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            User management is not available in demo mode. Connect to Supabase to enable this feature.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Enter full name"
          error={errors.name?.message}
          disabled={!isSupabaseConnected}
          {...register('name')}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="Enter email address"
          error={errors.email?.message}
          disabled={!isSupabaseConnected}
          {...register('email')}
        />

        <div>
          <Input
            label={isEdit ? "New Password (leave blank to keep current)" : "Password"}
            placeholder="Enter password"
            showPasswordToggle
            error={errors.password?.message}
            disabled={!isSupabaseConnected}
            {...register('password')}
          />
          
          {password && !passwordValidation.isValid && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-600 font-medium">Password requirements:</p>
              {passwordValidation.errors.map((error, index) => (
                <p key={index} className="text-xs text-red-600">• {error}</p>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isSupabaseConnected}
            {...register('role_id')}
          >
            <option value="">Select Role</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.role_name}
              </option>
            ))}
          </select>
          {errors.role_id && (
            <p className="text-sm text-red-600 mt-1">{errors.role_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            User Rights
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {userRights.map(right => (
              <div key={right.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`right_${right.id}`}
                  checked={selectedRights.includes(right.id)}
                  onChange={(e) => handleRightChange(right.id, e.target.checked)}
                  disabled={!isSupabaseConnected}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`right_${right.id}`}
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  {right.right_name}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_active"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={!isSupabaseConnected}
            {...register('is_active')}
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active User
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!isSupabaseConnected || (password && !passwordValidation.isValid)}
          >
            {isEdit ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  );
};