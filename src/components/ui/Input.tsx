import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const FIELD_BASE =
  'w-full rounded-xl surface px-3.5 text-sm text-[var(--app-text)] placeholder:text-[var(--app-muted)] ' +
  'outline-none transition duration-150 focus:border-brand-500/70 focus:ring-4 focus:ring-brand-500/12 ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

const FIELD_ERROR = 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/15'

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-muted">
      {children}
    </label>
  )
}

function FieldFoot({ error, hint }: { error?: string | null; hint?: string }) {
  if (error) return <p className="mt-1.5 text-xs font-medium text-rose-500">{error}</p>
  if (hint) return <p className="mt-1.5 text-xs text-muted">{hint}</p>
  return null
}

/* ------------------------------------------------------------------ Input */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string | null
  hint?: string
  icon?: ReactNode
  wrapperClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, className, wrapperClassName, id, ...props },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--app-muted)] [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cn(FIELD_BASE, 'h-10', icon && 'pl-10', error && FIELD_ERROR, className)}
          {...props}
        />
      </div>
      <FieldFoot error={error} hint={hint} />
    </div>
  )
})

/* --------------------------------------------------------------- Textarea */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string | null
  hint?: string
  wrapperClassName?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, wrapperClassName, id, rows = 4, ...props },
  ref,
) {
  const autoId = useId()
  const areaId = id ?? autoId
  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label && <FieldLabel htmlFor={areaId}>{label}</FieldLabel>}
      <textarea
        ref={ref}
        id={areaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD_BASE, 'scroll-thin resize-y py-2.5 leading-relaxed', error && FIELD_ERROR, className)}
        {...props}
      />
      <FieldFoot error={error} hint={hint} />
    </div>
  )
})

/* ----------------------------------------------------------------- Select */

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string | null
  hint?: string
  options: SelectOption[]
  wrapperClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, className, wrapperClassName, id, ...props },
  ref,
) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label && <FieldLabel htmlFor={selectId}>{label}</FieldLabel>}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={cn(FIELD_BASE, 'h-10 cursor-pointer appearance-none pr-9', error && FIELD_ERROR, className)}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]" />
      </div>
      <FieldFoot error={error} hint={hint} />
    </div>
  )
})

/* ------------------------------------------------------------ SearchInput */

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }: SearchInputProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(FIELD_BASE, 'h-10 pl-10 pr-9 [&::-webkit-search-cancel-button]:appearance-none')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-[var(--app-muted)] transition hover:bg-black/5 hover:text-[var(--app-text)] dark:hover:bg-white/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
