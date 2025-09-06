import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, Database, Shield, Sparkles } from 'lucide-react';
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

  const { register, handleSubmit, formState: { errors }, watch } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const password = watch('password');

  React.useEffect(() => {
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
      if (!success) {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <Database className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-8 text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Query Management
          </h2>
          <div className="flex items-center justify-center mt-2 space-x-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <p className="text-lg text-gray-300 font-medium">
              Professional SQL Query Platform
            </p>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl py-10 px-8 shadow-2xl rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              error={errors.email?.message}
              className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500"
              {...register('email')}
            />

            <div>
              <Input
                label="Password"
                placeholder="Enter your password"
                showPasswordToggle
                error={errors.password?.message}
                className="bg-white/90 border-white/30 text-gray-900 placeholder-gray-500"
                {...register('password')}
              />
              
              {passwordErrors.length > 0 && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur-sm">
                  <p className="text-xs text-red-300 font-medium mb-2">Password requirements:</p>
                  {passwordErrors.map((error, index) => (
                    <p key={index} className="text-xs text-red-300">• {error}</p>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
              size="lg"
              loading={loading}
              icon={LogIn}
            >
              Sign In
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
            <div className="flex items-center space-x-2 mb-3">
              <Shield className="h-4 w-4 text-purple-400" />
              <p className="text-sm text-gray-300 font-semibold">Demo Credentials</p>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-purple-300 font-medium">Admin:</span>
                <span className="text-gray-300">admin@example.com</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-blue-300 font-medium">User:</span>
                <span className="text-gray-300">user@example.com</span>
              </div>
              <div className="text-center pt-2">
                <span className="text-gray-400 text-xs">Password: Admin123!@#$4567 / User123!@#$4567</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Secure • Scalable • Professional
          </p>
        </div>
      </div>
    </div>
  );
};