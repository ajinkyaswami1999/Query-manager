import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, Database, Shield, ArrowRight, Zap } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { validatePassword } from '../../utils/validation';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const { signIn } = useAuth();

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const password = watch('password') || '';

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
    } catch {
      setLoading(false);
    }
  };

  const fillCredentials = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Subtle Background Grid & Glow */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(99, 102, 241, 0.25) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 mb-4">
          <Database className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          QueryMaster Platform
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          Sign in to access your organization's SQL repository
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-8 shadow-2xl rounded-2xl border border-slate-800">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Work Email"
              labelClassName="text-slate-300"
              type="email"
              placeholder="name@company.com"
              error={errors.email?.message}
              className="bg-slate-950/80 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500"
              {...register('email')}
            />

            <div>
              <Input
                label="Password"
                labelClassName="text-slate-300"
                placeholder="Enter account password"
                showPasswordToggle
                error={errors.password?.message}
                className="bg-slate-950/80 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500"
                {...register('password')}
              />

              {password.length > 0 && passwordErrors.length > 0 && (
                <div className="mt-2.5 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <span className="font-semibold text-slate-300 block mb-1">Password complexity requirements:</span>
                  {passwordErrors.map((err, i) => (
                    <div key={i} className="text-rose-400 flex items-center space-x-1.5">
                      <span>•</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              icon={LogIn}
              className="w-full justify-center mt-2 py-2.5"
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Quick 1-Click Demo Fillers */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Quick Test Logins</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">1-Click Fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@example.com', 'Admin123!@#$4567')}
                className="flex items-center justify-between p-2.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-colors group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">Admin Account</p>
                  <p className="text-[10px] text-slate-500">Full privileges</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-indigo-400" />
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('user@example.com', 'User123!@#$4567')}
                className="flex items-center justify-between p-2.5 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-colors group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">Analyst Account</p>
                  <p className="text-[10px] text-slate-500">Standard access</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-indigo-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
          <Shield className="h-3.5 w-3.5 text-slate-600" />
          <span>Role-Based Access Control · PostgreSQL RLS Encrypted</span>
        </div>
      </div>
    </div>
  );
};