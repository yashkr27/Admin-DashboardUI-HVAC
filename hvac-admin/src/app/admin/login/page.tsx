'use client'

import { supabase } from '@/lib/supabase'
import { zodResolver } from '@hookform/resolvers/zod'
import { Wind } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginForm) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    router.replace('/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-800/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md px-4">
        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <Wind size={28} className="text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">HVAC Admin</h1>
              <p className="mt-1 text-sm text-slate-400">Sign in to your dashboard</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                placeholder="admin@hvac.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none ring-0 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none ring-0 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Protected admin area · HVAC Business Suite
        </p>
      </div>
    </div>
  )
}
