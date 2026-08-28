import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion'
import {
  AlertCircle,
  BarChart3,
  Eye,
  EyeOff,
  KanbanSquare,
  Lock,
  Moon,
  Sparkles,
  Sun,
  TrendingUp,
  Users2,
} from 'lucide-react'
import { Input, Progress, type InputProps } from '@/components/ui'
import { useTheme } from '@/store/theme'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------ brand panel */

const FEATURES = [
  {
    icon: KanbanSquare,
    title: 'Boards that keep up',
    description: 'Drag a card and the whole team sees it move. No refresh, no re-explaining.',
  },
  {
    icon: BarChart3,
    title: 'Progress you can read',
    description: 'Workload, velocity and overdue work on one dashboard — always current.',
  },
  {
    icon: Users2,
    title: 'Everyone in the loop',
    description: 'Comments, subtasks and activity trails attached to the work itself.',
  },
] as const

interface OrbProps {
  /** position + size utilities for the floating wrapper */
  className: string
  tint: string
  delay: number
  duration: number
}

function Orb({ className, tint, delay, duration }: OrbProps) {
  const reduceMotion = useReducedMotion()
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute', !reduceMotion && 'animate-float', className)}
      style={reduceMotion ? undefined : { animationDelay: `${delay}s` }}
    >
      <motion.div
        className={cn('h-full w-full rounded-full blur-3xl', tint)}
        initial={{ opacity: 0.32, scale: 0.92 }}
        animate={reduceMotion ? { opacity: 0.4, scale: 1 } : { opacity: [0.3, 0.6, 0.3], scale: [0.92, 1.12, 0.92] }}
        transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
      />
    </div>
  )
}

function BrandPanel() {
  return (
    <aside className="brand-gradient relative hidden overflow-hidden lg:flex lg:w-[46%] xl:w-[48%]">
      <div className="grid-bg absolute inset-0 opacity-25 mix-blend-overlay" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10"
        aria-hidden="true"
      />

      <Orb className="-left-16 top-10 h-72 w-72" tint="bg-cyan-300/50" delay={0} duration={11} />
      <Orb className="right-[-70px] top-1/3 h-80 w-80" tint="bg-fuchsia-400/45" delay={1.6} duration={13} />
      <Orb className="bottom-[-60px] left-1/4 h-64 w-64" tint="bg-indigo-200/40" delay={3.2} duration={15} />

      <div className="relative z-10 flex w-full flex-col justify-between p-10 text-white xl:p-14">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/75">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Nexus PM
        </div>

        <div className="py-10">
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
            className="max-w-[13ch] text-4xl font-semibold leading-[1.06] tracking-tight xl:text-5xl"
          >
            Ship projects, not spreadsheets.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/80"
          >
            Plan the sprint, run the board and report on it from one workspace your team actually
            enjoys opening.
          </motion.p>

          <ul className="mt-10 space-y-5">
            {FEATURES.map((feature, index) => (
              <motion.li
                key={feature.title}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: 0.28 + index * 0.09 }}
                className="flex items-start gap-3.5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/25 backdrop-blur">
                  <feature.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold tracking-tight">{feature.title}</span>
                  <span className="mt-0.5 block max-w-xs text-[13px] leading-relaxed text-white/70">
                    {feature.description}
                  </span>
                </span>
              </motion.li>
            ))}
          </ul>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.6 }}
          className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/10 p-4 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
              This sprint
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white/85">
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              +18%
            </span>
          </div>
          <p className="mt-2.5 text-[26px] font-semibold tracking-tight">46 tasks tracked</p>
          <Progress
            value={70}
            label="Sprint completion"
            className="mt-3 h-1.5 bg-white/25"
            barClassName="bg-white"
          />
          <p className="mt-2.5 text-xs text-white/70">32 completed · 14 in flight · 6 teammates</p>
        </motion.div>
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------- left chrome */

function ThemeToggle() {
  const theme = useTheme((state) => state.theme)
  const toggle = useTheme((state) => state.toggle)
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="surface grid h-9 w-9 place-items-center rounded-xl text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  )
}

export interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="relative flex w-full flex-col overflow-hidden px-5 py-6 sm:px-8 lg:w-[54%] lg:px-14 xl:w-[52%]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-48 h-96 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(124,77,255,0.20),transparent_72%)] lg:hidden"
        />

        <header className="relative z-10 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2.5" aria-label="Nexus PM home">
            <span className="brand-gradient grid h-9 w-9 place-items-center rounded-xl text-[15px] font-extrabold text-white shadow-[var(--shadow-glow)]">
              N
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              Nexus <span className="brand-text">PM</span>
            </span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full max-w-[420px]"
          >
            <h1 className="text-[27px] font-semibold tracking-tight sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>}

            <div className="mt-8">{children}</div>

            {footer && <div className="mt-8 text-center text-sm text-muted">{footer}</div>}
          </motion.div>
        </main>

        <p className="relative z-10 text-center text-[11px] text-muted lg:text-left">
          © {new Date().getFullYear()} Nexus PM · Built for teams that would rather be shipping.
        </p>
      </div>

      <BrandPanel />
    </div>
  )
}

/* -------------------------------------------------- shared form primitives */

/** Shared by both auth forms: a gentle staggered fade-up for the field rows. */
export const formVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
}

export const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

export function FormError({ message }: { message: string | null }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key="auth-error"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <p
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-600 dark:text-rose-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{message}</span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export interface PasswordFieldProps extends Omit<InputProps, 'type' | 'icon' | 'label'> {
  /** Required: the reveal button is aligned to the field row that sits under it. */
  label: string
}

export function PasswordField({ label, className, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        {...props}
        label={label}
        type={visible ? 'text' : 'password'}
        icon={<Lock />}
        className={cn('pr-11', className)}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        tabIndex={-1}
        className="absolute right-2 top-[42px] grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-[var(--app-muted)] transition hover:bg-black/5 hover:text-[var(--app-text)] dark:hover:bg-white/10"
      >
        {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  )
}

export function FormDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-[var(--app-border)]" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
      <span className="h-px flex-1 bg-[var(--app-border)]" />
    </div>
  )
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
