import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BriefcaseBusiness, Mail, UserRound } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import {
  AuthLayout,
  EMAIL_PATTERN,
  FormError,
  PasswordField,
  fieldVariants,
  formVariants,
} from '@/features/auth/AuthLayout'
import { cn } from '@/lib/utils'
import { useAuth } from '@/store/auth'

const MIN_PASSWORD_LENGTH = 6

interface FieldErrors {
  full_name?: string
  email?: string
  password?: string
  confirm?: string
}

interface Strength {
  score: 0 | 1 | 2 | 3
  label: string
  bar: string
  text: string
}

/** Cheap, honest heuristic — length first, then character variety. */
function scorePassword(password: string): Strength {
  if (!password) return { score: 0, label: '', bar: 'bg-transparent', text: 'text-muted' }
  let points = 0
  if (password.length >= MIN_PASSWORD_LENGTH) points += 1
  if (password.length >= 10) points += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1
  if (/\d/.test(password)) points += 1
  if (/[^\w\s]/.test(password)) points += 1

  if (points <= 2) return { score: 1, label: 'Weak', bar: 'bg-rose-500', text: 'text-rose-500' }
  if (points <= 3) return { score: 2, label: 'Fair', bar: 'bg-amber-500', text: 'text-amber-500' }
  return { score: 3, label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-500' }
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const strength = useMemo(() => scorePassword(password), [password])

  function clearError(field: keyof FieldErrors) {
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = fullName.trim()
    const mail = email.trim()
    const nextErrors: FieldErrors = {}

    if (name.length < 2) nextErrors.full_name = 'Enter your full name'
    if (!mail) nextErrors.email = 'Email is required'
    else if (!EMAIL_PATTERN.test(mail)) nextErrors.email = 'Enter a valid email address'
    if (password.length < MIN_PASSWORD_LENGTH)
      nextErrors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters`
    if (confirm !== password) nextErrors.confirm = 'Passwords do not match'

    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    setBanner(null)
    setPending(true)
    try {
      await register({
        email: mail,
        full_name: name,
        password,
        job_title: jobTitle.trim() || undefined,
      })
      navigate('/', { replace: true })
    } catch (error) {
      setBanner(error instanceof Error ? error.message : 'Unable to create your account')
      setPending(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up your workspace in under a minute — no credit card, no setup call."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-500 transition hover:text-brand-400">
            Sign in
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
            label="Full name"
            name="full_name"
            autoComplete="name"
            autoFocus
            placeholder="Aarav Sharma"
            icon={<UserRound />}
            value={fullName}
            error={errors.full_name}
            disabled={pending}
            onChange={(event) => {
              setFullName(event.target.value)
              clearError('full_name')
            }}
          />
        </motion.div>

        <motion.div variants={fieldVariants}>
          <Input
            label="Work email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@company.com"
            icon={<Mail />}
            value={email}
            error={errors.email}
            disabled={pending}
            onChange={(event) => {
              setEmail(event.target.value)
              clearError('email')
            }}
          />
        </motion.div>

        <motion.div variants={fieldVariants}>
          <Input
            label="Job title"
            name="job_title"
            autoComplete="organization-title"
            placeholder="Product Manager"
            hint="Optional — shown on your profile and team card."
            icon={<BriefcaseBusiness />}
            value={jobTitle}
            disabled={pending}
            onChange={(event) => setJobTitle(event.target.value)}
          />
        </motion.div>

        <motion.div variants={fieldVariants}>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            value={password}
            error={errors.password}
            disabled={pending}
            onChange={(event) => {
              setPassword(event.target.value)
              clearError('password')
              if (confirm) clearError('confirm')
            }}
          />
          {password && !errors.password && (
            <div className="mt-2 flex items-center gap-2.5">
              <div className="flex h-1.5 flex-1 gap-1" aria-hidden="true">
                {[1, 2, 3].map((step) => (
                  <span
                    key={step}
                    className={cn(
                      'flex-1 rounded-full transition-colors duration-300',
                      step <= strength.score ? strength.bar : 'bg-[var(--app-border)]',
                    )}
                  />
                ))}
              </div>
              <span className={cn('text-xs font-medium', strength.text)} role="status" aria-live="polite">
                {strength.label}
              </span>
            </div>
          )}
        </motion.div>

        <motion.div variants={fieldVariants}>
          <PasswordField
            label="Confirm password"
            name="confirm_password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirm}
            error={errors.confirm}
            disabled={pending}
            onChange={(event) => {
              setConfirm(event.target.value)
              clearError('confirm')
            }}
          />
        </motion.div>

        <motion.div variants={fieldVariants} className="pt-1">
          <Button type="submit" size="lg" className="w-full" loading={pending} rightIcon={<ArrowRight />}>
            Create account
          </Button>
          <p className="mt-2.5 text-center text-xs text-muted">
            By continuing you agree to keep this demo workspace tidy. That's the whole agreement.
          </p>
        </motion.div>
      </motion.form>
    </AuthLayout>
  )
}
