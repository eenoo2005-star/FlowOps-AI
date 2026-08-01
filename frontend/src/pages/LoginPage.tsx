import { useState } from 'react'
import axios from 'axios'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import FlowBackground from '../components/layout/FlowBackground'
import ThemeModeControl from '../components/layout/ThemeModeControl'
import {
  loginSchema,
  type LoginFormData,
} from '../features/auth/loginSchema'
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  GitBranch,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react'

function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] =
    useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  })

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) =>
      authService.login({
        email: data.email,
        password: data.password,
        device_name: 'flowops-web',
      }),

    onSuccess: (response, variables) => {
      const storage = variables.remember
        ? localStorage
        : sessionStorage

      localStorage.removeItem('flowops_token')
      localStorage.removeItem('flowops_user')
      sessionStorage.removeItem('flowops_token')
      sessionStorage.removeItem('flowops_user')

      storage.setItem('flowops_token', response.token)
      storage.setItem(
        'flowops_user',
        JSON.stringify(response.user),
      )

      navigate('/dashboard', {
        replace: true,
      })
    },
  })

  const onSubmit = handleSubmit((data) => {
    loginMutation.reset()
    loginMutation.mutate(data)
  })

  const loginError = axios.isAxiosError(
    loginMutation.error,
  )
    ? (
        loginMutation.error.response?.data as
          | {
              message?: string
              errors?: {
                email?: string[]
              }
            }
          | undefined
      )?.errors?.email?.[0]
      ?? loginMutation.error.response?.data?.message
      ?? 'Unable to connect to the authentication server.'
    : loginMutation.error
      ? 'An unexpected error occurred.'
      : null

  return (
    <main className="login-page">
      <FlowBackground variant="login" />

      <div className="login-theme-control">
        <ThemeModeControl compact />
      </div>

      <div className="background-grid" />
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />
      <div className="background-glow glow-three" />

      <div className="floating-particle particle-one" />
      <div className="floating-particle particle-two" />
      <div className="floating-particle particle-three" />
      <div className="floating-particle particle-four" />
      <div className="floating-particle particle-five" />

      <section className="login-shell">
        <div className="brand-panel">
          <div className="brand-content">
            <div className="brand-badge">
              <Sparkles size={15} />
              AI-powered enterprise operations
            </div>

            <div className="brand-logo">
              <div className="logo-symbol">
                <Workflow
                  size={27}
                  strokeWidth={2.2}
                />
              </div>

              <div>
                <p className="brand-name">
                  FlowOps AI
                </p>

                <p className="brand-subtitle">
                  Enterprise Workflow Intelligence
                </p>
              </div>
            </div>

            <div className="brand-heading">
              <p className="eyebrow">
                OPERATIONS. AUTOMATED.
              </p>

              <h1>
                Orchestrate every workflow
                <span>
                  {' '}
                  from one intelligent platform.
                </span>
              </h1>

              <p className="brand-description">
                Connect teams, automate approvals,
                monitor performance and transform
                operational data into actionable
                intelligence.
              </p>
            </div>

            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon">
                  <GitBranch size={18} />
                </div>

                <div>
                  <strong>
                    Intelligent workflows
                  </strong>

                  <span>
                    Design and control complex business
                    processes.
                  </span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <BarChart3 size={18} />
                </div>

                <div>
                  <strong>
                    Executive visibility
                  </strong>

                  <span>
                    Live operational KPIs and
                    decision-ready insights.
                  </span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <strong>
                    Enterprise security
                  </strong>

                  <span>
                    Multi-tenant isolation and
                    role-based access.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="system-status">
            <div className="status-dot" />
            <span>
              All enterprise services operational
            </span>
          </div>
        </div>

        <div className="form-panel">
          <div className="mobile-logo">
            <div className="logo-symbol">
              <Workflow size={24} />
            </div>

            <span>FlowOps AI</span>
          </div>

          <div className="login-card">
            <div className="card-accent" />

            <div className="card-header">
              <div className="security-badge">
                <LockKeyhole size={15} />
                Secure workspace
              </div>

              <h2>Welcome back</h2>

              <p>
                Sign in to access your company&apos;s
                operations workspace.
              </p>
            </div>

            <form
              onSubmit={onSubmit}
              className="login-form"
              noValidate
            >
              <label className="form-field">
                <span>Work email</span>

                <div className="input-wrapper">
                  <Mail
                    className="input-icon"
                    size={18}
                  />

                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    aria-invalid={Boolean(
                      errors.email,
                    )}
                    {...register('email')}
                  />
                </div>

                {errors.email && (
                  <span className="field-error">
                    {errors.email.message}
                  </span>
                )}
              </label>

              <label className="form-field">
                <div className="field-heading">
                  <span>Password</span>

                  <button
                    type="button"
                    className="forgot-password"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="input-wrapper">
                  <LockKeyhole
                    className="input-icon"
                    size={18}
                  />

                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={Boolean(
                      errors.password,
                    )}
                    {...register('password')}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current,
                      )
                    }
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <span className="field-error">
                    {errors.password.message}
                  </span>
                )}
              </label>

              <label className="remember-row">
                <input
                  type="checkbox"
                  {...register('remember')}
                />

                <span>
                  Keep me signed in on this device
                </span>
              </label>

              {loginError && (
                <div
                  className="login-alert login-alert-error"
                  role="alert"
                >
                  {loginError}
                </div>
              )}

              {loginMutation.isSuccess && (
                <div className="login-alert login-alert-success">
                  Authentication successful. Your
                  workspace is ready.
                </div>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <span className="button-spinner" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign in to workspace
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="trust-row">
              <CheckCircle2 size={16} />

              <span>
                Protected by encrypted authentication
                and tenant isolation
              </span>
            </div>
          </div>

          <div className="ai-message">
            <Bot size={17} />

            <span>
              FlowOps Intelligence is ready to assist
              your team.
            </span>
          </div>

          <div className="copyright-block">
            <p className="copyright">
              © 2026 FlowOps AI. Enterprise operations
              platform.
            </p>

            <p className="creator-credit">
              Designed, engineered and built end-to-end
              by
              <span>
                {' '}
                Software Engineer Shaheen Idris
              </span>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
