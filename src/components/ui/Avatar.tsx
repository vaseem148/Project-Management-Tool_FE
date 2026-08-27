import { cn, avatarColor, colorClasses, initials } from '@/lib/utils'

export interface AvatarUser {
  id: number
  full_name: string
  avatar_color?: string | null
}

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg'

export interface AvatarProps {
  user: AvatarUser | null | undefined
  size?: AvatarSize
  className?: string
  /** Set false to drop the native tooltip (e.g. when a wrapper supplies its own). */
  showTitle?: boolean
}

const SIZES: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
}

export function Avatar({ user, size = 'md', className, showTitle = true }: AvatarProps) {
  const color = user ? avatarColor(user.id, user.avatar_color) : 'slate'
  const tone = colorClasses(color)
  return (
    <span
      role="img"
      title={showTitle && user ? user.full_name : undefined}
      aria-label={user ? user.full_name : 'Unassigned'}
      className={cn(
        'relative inline-grid shrink-0 select-none place-items-center overflow-hidden rounded-full',
        'font-semibold uppercase tracking-wide text-white ring-1 ring-inset ring-white/15',
        tone.bg,
        SIZES[size],
        !user && 'text-white/70',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/5 to-black/25"
      />
      <span className="relative leading-none">{user ? initials(user.full_name) : '?'}</span>
    </span>
  )
}

export interface AvatarGroupProps {
  users: Array<AvatarUser | null | undefined>
  max?: number
  size?: AvatarSize
  className?: string
}

const OVERFLOW_SIZES: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-[11px]',
  lg: 'h-12 w-12 text-xs',
}

export function AvatarGroup({ users, max = 4, size = 'sm', className }: AvatarGroupProps) {
  const people = users.filter((user): user is AvatarUser => Boolean(user))
  const shown = people.slice(0, max)
  const overflow = people.length - shown.length

  if (people.length === 0) return null

  return (
    <div className={cn('flex items-center', className)}>
      {shown.map((user) => (
        <Avatar
          key={user.id}
          user={user}
          size={size}
          className="-ml-2 ring-2 ring-[var(--app-panel)] first:ml-0"
        />
      ))}
      {overflow > 0 && (
        <span
          title={people.slice(max).map((user) => user.full_name).join(', ')}
          className={cn(
            '-ml-2 inline-grid shrink-0 place-items-center rounded-full font-semibold text-muted',
            'bg-[var(--app-panel-2)] ring-2 ring-[var(--app-panel)]',
            OVERFLOW_SIZES[size],
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  )
}
