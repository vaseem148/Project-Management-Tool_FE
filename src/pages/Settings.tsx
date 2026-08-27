import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  CircleUser,
  LogOut,
  Mail,
  Moon,
  Palette,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  Input,
  Switch,
  Tabs,
  Textarea,
} from '@/components/ui'
import { useUpdateProfile } from '@/hooks/queries'
import { useAuth } from '@/store/auth'
import { useTheme, type Theme } from '@/store/theme'
import { COLORS, avatarColor, cn, colorClasses, formatDate } from '@/lib/utils'

const TABS = [
  { key: 'profile', label: 'Profile', icon: <CircleUser /> },
  { key: 'appearance', label: 'Appearance', icon: <Palette /> },
  { key: 'account', label: 'Account', icon: <ShieldCheck /> },
]

const DENSITY_KEY = 'pmt.density'

function readCompact(): boolean {
  try {
    return localStorage.getItem(DENSITY_KEY) === 'compact'
  } catch {
    return false
  }
}

/** Compact mode shrinks the root font size — every rem-based space follows it. */
function applyCompact(compact: boolean) {
  const root = document.documentElement
  root.classList.toggle('compact', compact)
  root.style.fontSize = compact ? '15px' : ''
  try {
    localStorage.setItem(DENSITY_KEY, compact ? 'compact' : 'comfortable')
  } catch {
    /* storage blocked — the preference just won't survive a reload */
  }
}

interface ProfileForm {
  full_name: string
  job_title: string
  bio: string
  avatar_color: string
}

function emptyForm(): ProfileForm {
  return { full_name: '', job_title: '', bio: '', avatar_color: '' }
}

/* --------------------------------------------------------------- appearance */

const THEME_SWATCH: Record<Theme, { bg: string; panel: string; border: string; text: string; muted: string }> = {
  dark: { bg: '#0a0c12', panel: '#11141d', border: '#232838', text: '#eef0f6', muted: '#8f9aad' },
  light: { bg: '#f6f7fb', panel: '#ffffff', border: '#e6e8f0', text: '#141822', muted: '#6b7688' },
}

function ThemePreview({ mode }: { mode: Theme }) {
  const tone = THEME_SWATCH[mode]
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none overflow-hidden rounded-xl border"
      style={{ background: tone.bg, borderColor: tone.border }}
    >
      <div className="flex h-28 gap-2 p-2.5">
        <div
          className="flex w-9 flex-col gap-1.5 rounded-lg border p-1.5"
          style={{ background: tone.panel, borderColor: tone.border }}
        >
          <span className="h-2.5 w-2.5 rounded-md" style={{ background: '#7c4dff' }} />
          <span className="h-1.5 w-full rounded-full" style={{ background: tone.border }} />
          <span className="h-1.5 w-4/5 rounded-full" style={{ background: tone.border }} />
          <span className="h-1.5 w-3/5 rounded-full" style={{ background: tone.border }} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-12 rounded-full" style={{ background: tone.muted }} />
            <span className="ml-auto h-3.5 w-10 rounded-md" style={{ background: '#7c4dff' }} />
          </div>
          <div className="grid flex-1 grid-cols-3 gap-1.5">
            {[0, 1, 2].map((column) => (
              <div
                key={column}
                className="flex flex-col gap-1.5 rounded-lg border p-1.5"
                style={{ background: tone.panel, borderColor: tone.border }}
              >
                <span className="h-1.5 w-2/3 rounded-full" style={{ background: tone.muted }} />
                <span className="h-3 w-full rounded" style={{ background: tone.border }} />
                {column === 0 && <span className="h-3 w-full rounded" style={{ background: tone.border }} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ThemeCard({ mode, active, onSelect }: { mode: Theme; active: boolean; onSelect: () => void }) {
  const Icon = mode === 'dark' ? Moon : Sun
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'surface w-full rounded-2xl p-3 text-left transition duration-200',
        'outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]',
        active ? 'border-brand-500/60 ring-2 ring-brand-500/25' : 'hover:-translate-y-0.5 hover:border-brand-500/35',
      )}
    >
      <ThemePreview mode={mode} />
      <div className="mt-3 flex items-center gap-2 px-1 pb-1">
        <Icon className="h-4 w-4 text-brand-500" aria-hidden="true" />
        <span className="text-sm font-medium tracking-tight">{mode === 'dark' ? 'Dark' : 'Light'}</span>
        {active && (
          <span className="ml-auto grid h-5 w-5 place-items-center rounded-full brand-gradient text-white">
            <Check className="h-3 w-3" aria-hidden="true" />
          </span>
        )}
      </div>
    </button>
  )
}

/* --------------------------------------------------------------------- page */

export default function Settings() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const updateProfile = useUpdateProfile()

  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState<ProfileForm>(emptyForm)
  const [nameError, setNameError] = useState<string | null>(null)
  const [compact, setCompact] = useState(readCompact)
  const [logoutOpen, setLogoutOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({
      full_name: user.full_name ?? '',
      job_title: user.job_title ?? '',
      bio: user.bio ?? '',
      avatar_color: user.avatar_color ?? '',
    })
    setNameError(null)
  }, [user])

  useEffect(() => {
    applyCompact(compact)
  }, [compact])

  const dirty = useMemo(() => {
    if (!user) return false
    return (
      form.full_name.trim() !== (user.full_name ?? '') ||
      form.job_title.trim() !== (user.job_title ?? '') ||
      form.bio.trim() !== (user.bio ?? '') ||
      form.avatar_color !== (user.avatar_color ?? '')
    )
  }, [form, user])

  if (!user) return null

  const activeColor = form.avatar_color || avatarColor(user.id)
  const preview = { id: user.id, full_name: form.full_name.trim() || user.full_name, avatar_color: activeColor }

  const reset = () => {
    setForm({
      full_name: user.full_name ?? '',
      job_title: user.job_title ?? '',
      bio: user.bio ?? '',
      avatar_color: user.avatar_color ?? '',
    })
    setNameError(null)
  }

  const save = async () => {
    const fullName = form.full_name.trim()
    if (fullName.length < 2) {
      setNameError('Please enter your full name')
      return
    }
    setNameError(null)
    try {
      await updateProfile.mutateAsync({
        full_name: fullName,
        job_title: form.job_title.trim() || null,
        bio: form.bio.trim() || null,
        avatar_color: form.avatar_color || null,
      })
      toast.success('Profile updated')
    } catch {
      /* the mutation hook surfaces the error toast */
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Settings</h1>
        <p className="mt-1 text-sm text-muted">Tune your profile, the look of the workspace and your account.</p>
      </header>

      <div className="mt-5">
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 space-y-5"
      >
        {tab === 'profile' && (
          <Card>
            <CardHeader title="Your profile" description="This is how teammates see you across Nexus PM." />
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar user={preview} size="lg" className="h-16 w-16 text-lg" showTitle={false} />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold tracking-tight">
                    {form.full_name.trim() || user.full_name}
                  </p>
                  <p className="truncate text-sm text-muted">{form.job_title.trim() || 'Add a job title'}</p>
                  <p className="mt-1 truncate text-xs text-muted">{user.email}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  value={form.full_name}
                  error={nameError}
                  onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                  placeholder="Ada Lovelace"
                />
                <Input
                  label="Job title"
                  value={form.job_title}
                  onChange={(event) => setForm((current) => ({ ...current, job_title: event.target.value }))}
                  placeholder="Product Designer"
                />
              </div>

              <Textarea
                label="Bio"
                value={form.bio}
                rows={4}
                maxLength={280}
                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                placeholder="A sentence or two about what you work on."
                hint={`${form.bio.length}/280`}
              />

              <div>
                <p className="mb-2 text-xs font-medium text-muted">Avatar colour</p>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => {
                    const tone = colorClasses(color)
                    const selected = activeColor === color
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, avatar_color: color }))}
                        aria-label={`Use ${color} avatar`}
                        aria-pressed={selected}
                        className={cn(
                          'grid h-9 w-9 place-items-center rounded-full text-white transition duration-150',
                          'outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-ring)]',
                          tone.bg,
                          selected
                            ? 'ring-2 ring-offset-2 ring-brand-500 ring-offset-[var(--app-panel)]'
                            : 'opacity-80 hover:scale-105 hover:opacity-100',
                        )}
                      >
                        {selected && <Check className="h-4 w-4" aria-hidden="true" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--app-border)] pt-4">
                {dirty && (
                  <span className="mr-auto flex items-center gap-1.5 text-xs text-muted">
                    <Sparkles className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
                    You have unsaved changes
                  </span>
                )}
                <Button variant="ghost" onClick={reset} disabled={!dirty || updateProfile.isPending}>
                  Reset
                </Button>
                <Button onClick={() => void save()} loading={updateProfile.isPending} disabled={!dirty}>
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === 'appearance' && (
          <>
            <Card>
              <CardHeader title="Theme" description="Nexus PM is designed dark first — pick what suits your room." />
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ThemeCard mode="dark" active={theme === 'dark'} onSelect={() => setTheme('dark')} />
                  <ThemeCard mode="light" active={theme === 'light'} onSelect={() => setTheme('light')} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Density" description="Fit more of the board on screen." />
              <CardContent>
                <Switch
                  checked={compact}
                  onChange={setCompact}
                  label="Compact mode"
                  description="Tightens spacing and type across every page. Saved on this device."
                />
              </CardContent>
            </Card>
          </>
        )}

        {tab === 'account' && (
          <>
            <Card>
              <CardHeader title="Account" description="Details tied to your sign-in." />
              <CardContent className="space-y-4">
                <Input
                  label="Email address"
                  value={user.email}
                  readOnly
                  disabled
                  icon={<Mail />}
                  hint="Your email is used to sign in and cannot be changed here."
                />
                <div className="surface surface-2 flex items-center justify-between gap-4 rounded-xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium tracking-tight">Member since</p>
                    <p className="mt-0.5 text-xs text-muted">{formatDate(user.created_at, 'MMMM d, yyyy')}</p>
                  </div>
                  <Badge variant="soft">Nexus PM</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-rose-500/30">
              <CardHeader title="Danger zone" description="Sign out of Nexus PM on this device." />
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted">
                    You will need your email and password to sign back in.
                  </p>
                  <Button variant="danger" leftIcon={<LogOut />} onClick={() => setLogoutOpen(true)}>
                    Log out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false)
          logout()
        }}
        title="Log out?"
        description="You will be signed out on this device and returned to the login screen."
        confirmLabel="Log out"
        danger
      />
    </div>
  )
}
