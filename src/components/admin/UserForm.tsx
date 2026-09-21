import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, FileCode, Check } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabaseAdmin } from '../../lib/supabase';
import { User, Role, UserRight } from '../../types';
import { validatePassword } from '../../utils/validation';
import { useAuth } from '../../hooks/useAuth';
import { handleSupabaseError, showSuccessMessage, handleNetworkError } from '../../utils/apiErrorHandler';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  role_id: z.string().min(1, 'Role selection is required'),
  is_active: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  user?: User;
  onSuccess: (savedUser?: User) => void;
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
  const [selectedRights, setSelectedRights] = useState<string[]>([]);
  const { isSupabaseConnected } = useAuth();

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      role_id: user?.role_id || (roles[0]?.id || ''),
      is_active: user?.is_active ?? true
    }
  });

  const password = watch('password') || '';

  useEffect(() => {
    if (user && isSupabaseConnected) {
      loadUserRights();
    } else if (user && !isSupabaseConnected) {
      // Default demo rights
      setSelectedRights(['right-1', 'right-2', 'right-4']);
    } else {
      setSelectedRights(['right-1', 'right-2', 'right-4']);
    }
  }, [user, isSupabaseConnected]);

  const loadUserRights = async () => {
    if (!user || !isSupabaseConnected) return;
    try {
      const { data, error } = await supabaseAdmin
        .from('user_role_rights')
        .select('right_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading user rights:', error);
        return;
      }
      setSelectedRights(data.map((r: any) => r.right_id));
    } catch (error) {
      console.error('Error loading user rights:', error);
    }
  };

  const handleRightToggle = (rightId: string) => {
    setSelectedRights(prev =>
      prev.includes(rightId) ? prev.filter(id => id !== rightId) : [...prev, rightId]
    );
  };

  const onSubmit = async (data: UserFormData) => {
    if (!isEdit && data.password) {
      const validation = validatePassword(data.password);
      if (!validation.isValid) {
        handleSupabaseError({ message: `Password validation failed: ${validation.errors.join(', ')}` }, 'validate password');
        return;
      }
    }

    const assignedRole = roles.find(r => r.id === data.role_id);

    // Session Mode
    if (!isSupabaseConnected) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const mockResult: User = {
        id: user?.id || `user-demo-${Date.now()}`,
        name: data.name.trim(),
        email: data.email.trim(),
        role_id: data.role_id,
        is_active: data.is_active,
        created_at: user?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: assignedRole
      };
      showSuccessMessage(`User ${isEdit ? 'updated' : 'created'} successfully (Session Mode)`);
      onSuccess(mockResult);
      return;
    }

    try {
      if (isEdit) {
        const updateData: any = {
          name: data.name.trim(),
          email: data.email.trim(),
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
          handleSupabaseError(updateError, 'update user');
          return;
        }

        // Update rights
        await supabaseAdmin.from('user_role_rights').delete().eq('user_id', user!.id);
        if (selectedRights.length > 0) {
          const rightsData = selectedRights.map(rightId => ({
            user_id: user!.id,
            right_id: rightId
          }));
          await supabaseAdmin.from('user_role_rights').insert(rightsData);
        }

        showSuccessMessage('User updated successfully');
      } else {
        if (!data.password) {
          handleSupabaseError({ message: 'Password is required for new users' }, 'create user');
          return;
        }

        const newUserId = crypto.randomUUID();
        const { error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            id: newUserId,
            name: data.name.trim(),
            email: data.email.trim(),
            password_hash: data.password,
            role_id: data.role_id,
            is_active: data.is_active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (userError) {
          handleSupabaseError(userError, 'create user');
          return;
        }

        if (selectedRights.length > 0) {
          const rightsData = selectedRights.map(rightId => ({
            user_id: newUserId,
            right_id: rightId
          }));
          await supabaseAdmin.from('user_role_rights').insert(rightsData);
        }

        showSuccessMessage('User created successfully');
      }
      onSuccess();
    } catch {
      handleNetworkError(`${isEdit ? 'update' : 'create'} user`);
    }
  };

  const passwordValidation = password ? validatePassword(password) : { isValid: true, errors: [] };

  const queryRights = userRights.filter(r => r.right_name.includes('QUERY'));
  const adminRights = userRights.filter(r => !r.right_name.includes('QUERY'));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          placeholder="e.g. Sarah Connor"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. sarah@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Role Select */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Account Role Tier
          </label>
          <select
            className="block w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl shadow-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            {...register('role_id')}
          >
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.role_name} — {role.description}
              </option>
            ))}
          </select>
          {errors.role_id && (
            <p className="text-xs text-rose-600 mt-1">{errors.role_id.message}</p>
          )}
        </div>

        {/* Password input */}
        <div>
          <Input
            label={isEdit ? "New Password (optional)" : "Password"}
            placeholder="Min 10 chars, Capital, 2 special, 4 numbers"
            showPasswordToggle
            error={errors.password?.message}
            {...register('password')}
          />
        </div>
      </div>

      {password && !passwordValidation.isValid && (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
          <p className="font-semibold">Password requirements:</p>
          {passwordValidation.errors.map((err, i) => (
            <p key={i}>• {err}</p>
          ))}
        </div>
      )}

      {/* Permissions Grid */}
      <div className="space-y-3 pt-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Functional Permission Rights ({selectedRights.length} selected)
        </label>

        {/* Query Rights */}
        <div className="space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500">
            <FileCode className="h-3.5 w-3.5 text-indigo-600" />
            <span>SQL Query Permissions</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {queryRights.map(right => {
              const isChecked = selectedRights.includes(right.id);
              return (
                <div
                  key={right.id}
                  onClick={() => handleRightToggle(right.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold leading-none">{right.right_name.replace(/_/g, ' ')}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{right.description}</p>
                  </div>
                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                    isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                  }`}>
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Admin Rights */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500">
            <Shield className="h-3.5 w-3.5 text-purple-600" />
            <span>System Administration Permissions</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {adminRights.map(right => {
              const isChecked = selectedRights.includes(right.id);
              return (
                <div
                  key={right.id}
                  onClick={() => handleRightToggle(right.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-purple-50/70 border-purple-200 text-purple-900 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold leading-none">{right.right_name.replace(/_/g, ' ')}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{right.description}</p>
                  </div>
                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                    isChecked ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300'
                  }`}>
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active User Toggle */}
      <div className="flex items-center space-x-2.5 pt-2">
        <input
          type="checkbox"
          id="user_is_active"
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
          {...register('is_active')}
        />
        <label htmlFor="user_is_active" className="text-xs font-semibold text-slate-800 cursor-pointer">
          Account Active and Enabled for Login
        </label>
      </div>

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
          disabled={password ? !passwordValidation.isValid : false}
        >
          {isEdit ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};