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
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormData = z.infer<typeof schema>;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.register(data);
      setAuth(res.data.user, res.data.token);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setGoogleLoading(true);
      const res = await authApi.google(credentialResponse.credential);
      setAuth(res.data.user, res.data.token);
      toast.success('Account created!');
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
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">JobAI</span>
        </div>

        <div className="card p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Create account</h1>
          <p className="text-sm text-gray-500 mb-6">Start landing your dream job with AI.</p>

          {/* Google Sign-Up */}
          <div className="flex justify-center mb-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google sign-up failed')}
              size="large"
              width="100%"
              text="signup_with"
              shape="rectangular"
              theme="outline"
            />
          </div>

          {googleLoading && (
            <p className="text-center text-xs text-gray-400 mb-4">Creating account with Google...</p>
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
              label="Full name"
              placeholder="Jane Smith"
              error={errors.name?.message}
              {...register('name')}
            />
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
              placeholder="Min. 8 characters"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
