import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Mail, Sparkles } from 'lucide-react'
import { Button, Input, Switch } from '@/components/ui'
import {
  AuthLayout,
  EMAIL_PATTERN,
  FormDivider,
  FormError,
  PasswordField,
  fieldVariants,
  formVariants,
} from '@/features/auth/AuthLayout'
import { useAuth } from '@/store/auth'

const DEMO_EMAIL = 'demo@pmt.app'
const DEMO_PASSWORD = 'demo1234'
const REMEMBER_KEY = 'pmt.remembered-email'

interface FieldErrors {
  email?: string
  password?: string
}

type Pending = 'form' | 'demo' | null

function readRememberedEmail(): string {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? ''
  } catch {
    return ''
  }
}

function storeRememberedEmail(remember: boolean, email: string) {
  try {
    if (remember) localStorage.setItem(REMEMBER_KEY, email)
    else localStorage.removeItem(REMEMBER_KEY)
  } catch {
    /* storage blocked — the preference just won't survive a reload */
  }
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const remembered = readRememberedEmail()
  const [email, setEmail] = useState(remembered)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(Boolean(remembered))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending>(null)

  const redirectTo = (() => {
    const from = (location.state as { from?: string } | null)?.from
    if (!from || from.startsWith('/login') || from.startsWith('/register')) return '/'
    return from
  })()

  async function signIn(nextEmail: string, nextPassword: string, mode: Exclude<Pending, null>) {
    const trimmed = nextEmail.trim()
    const nextErrors: FieldErrors = {}
    if (!trimmed) nextErrors.email = 'Email is required'
    else if (!EMAIL_PATTERN.test(trimmed)) nextErrors.email = 'Enter a valid email address'
    if (!nextPassword) nextErrors.password = 'Password is required'

    setErrors(nextErrors)
    if (nextErrors.email || nextErrors.password) return

    setBanner(null)
    setPending(mode)
    try {
      await login(trimmed, nextPassword)
      storeRememberedEmail(mode === 'demo' ? true : remember, trimmed)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setBanner(error instanceof Error ? error.message : 'Unable to sign in')
      setPending(null)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void signIn(email, password, 'form')
  }

  function handleDemo() {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setErrors({})
    void signIn(DEMO_EMAIL, DEMO_PASSWORD, 'demo')
  }

  const busy = pending !== null

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up exactly where your team left off."
      footer={
        <>
          New to Nexus PM?{' '}
          <Link
            to="/register"
            className="font-medium text-brand-500 transition hover:text-brand-400"
          >
            Create an account
          </Link>
        </>
      }
    >
      <motion.form
        variants={formVariants}
        initial="hidden"
        animate="show"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4"
      >
        <FormError message={banner} />

        <motion.div variants={fieldVariants}>
          <Input
            label="Work email"
            type="email"
            name="email"
            autoComplete="email"
            autoFocus
            placeholder="you@company.com"
            icon={<Mail />}
            value={email}
            error={errors.email}
            disabled={busy}
            onChange={(event) => {
              setEmail(event.target.value)
              if (errors.email) setErrors((current) => ({ ...current, email: undefined }))
            }}
          />
        </motion.div>

        <motion.div variants={fieldVariants}>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            error={errors.password}
            disabled={busy}
            onChange={(event) => {
              setPassword(event.target.value)
              if (errors.password) setErrors((current) => ({ ...current, password: undefined }))
            }}
          />
        </motion.div>

        <motion.div variants={fieldVariants} className="flex items-center justify-between gap-4 pt-0.5">
          <Switch
            checked={remember}
            onChange={setRemember}
            label="Remember me"
            disabled={busy}
            className="gap-2.5"
          />
          <span className="text-xs text-muted">Sessions last 7 days</span>
        </motion.div>

        <motion.div variants={fieldVariants} className="pt-1">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={pending === 'form'}
            disabled={busy}
            rightIcon={<ArrowRight />}
          >
            Sign in
          </Button>
        </motion.div>

        <motion.div variants={fieldVariants} className="py-1">
          <FormDivider label="or" />
        </motion.div>

        <motion.div variants={fieldVariants}>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full border-brand-500/35 text-brand-500 hover:bg-brand-500/8 hover:text-brand-400"
            onClick={handleDemo}
            loading={pending === 'demo'}
            disabled={busy}
            leftIcon={<Sparkles />}
          >
            Try the demo account
          </Button>
          <p className="mt-2.5 text-center text-xs text-muted">
            Signs you in as <span className="font-medium text-[var(--app-text)]">{DEMO_EMAIL}</span> with a
            fully seeded workspace — no signup needed.
          </p>
        </motion.div>
      </motion.form>
    </AuthLayout>
  )
}
