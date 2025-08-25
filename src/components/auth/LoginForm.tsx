import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { LogIn, Database } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { validatePassword } from '../../utils/validation';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const password = watch('password');

  useEffect(() => {
    if (password && password.length > 0) {
      const validation = validatePassword(password);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  }, [password]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const success = await signIn(data.email, data.password);
      if (success) {
        navigate('/dashboard'); // Change route to your dashboard/home
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Query Management System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your queries
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <Input
                label="Password"
                placeholder="Enter your password"
                showPasswordToggle
                error={errors.password?.message}
                {...register('password')}
              />

              {passwordErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-600 font-medium">
                    Password requirements:
                  </p>
                  {passwordErrors.map((error, index) => (
                    <p key={index} className="text-xs text-red-600">
                      • {error}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
              icon={LogIn}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 font-medium mb-2">
              Demo Credentials:
            </p>
            <p className="text-xs text-gray-600">
              Admin: admin@example.com / Admin123!@#$4567
            </p>
            <p className="text-xs text-gray-600">
              User: user@example.com / User123!@#$4567
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
