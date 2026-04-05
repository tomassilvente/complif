'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import api from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Ingrese un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true)
    try {
      const response = await api.post('/api/auth/login', data)
      const { accessToken, user } = response.data
      login(accessToken, user)
      toast.success('Sesión iniciada correctamente.')
      router.push('/dashboard')
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Credenciales inválidas. Intente nuevamente.'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1e3a5f] tracking-tight">
            complif<span className="text-[#3b82f6]">.</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Plataforma de onboarding KYB
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Iniciar sesión
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="correo@empresa.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              isLoading={loading}
            >
              Ingresar
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Complif. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
