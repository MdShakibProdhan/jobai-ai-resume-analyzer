import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { Sparkles } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button, Input } from '@/components/ui';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data);
      setAuth(res.data.user, res.data.token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setGoogleLoading(true);
      const res = await authApi.google(credentialResponse.credential);
      setAuth(res.data.user, res.data.token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">JobAI</span>
        </div>

        <div className="card p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-6">Welcome back. Enter your details below.</p>

          {/* Google Sign-In */}
          <div className="flex justify-center mb-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google sign-in failed')}
              size="large"
              width="100%"
              text="signin_with"
              shape="rectangular"
              theme="outline"
            />
          </div>

          {googleLoading && (
            <p className="text-center text-xs text-gray-400 mb-4">Signing in with Google...</p>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
