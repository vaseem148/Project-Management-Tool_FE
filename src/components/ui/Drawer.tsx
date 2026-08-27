import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDialogBehavior } from './Modal'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children?: ReactNode
  /** Width utility class for the panel. */
  width?: string
  headerAction?: ReactNode
  className?: string
}

/** Right-hand slide-over panel. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 'w-[min(560px,100vw)]',
  headerAction,
  className,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const headingId = useId()

  useDialogBehavior(open, panelRef, onClose)

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="drawer" className="fixed inset-0 z-[100]">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? 'Panel'}
            aria-labelledby={title ? headingId : undefined}
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.8 }}
            className={cn(
              'surface absolute right-0 top-0 flex h-full flex-col overflow-hidden rounded-2xl rounded-r-none outline-none',
              'shadow-[-30px_0_90px_-40px_rgba(8,10,18,0.7)]',
              width,
              className,
            )}
          >
            {(title || headerAction) && (
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--app-border)] px-5 py-4">
                {title ? (
                  <h2 id={headingId} className="truncate text-base font-semibold tracking-tight">
                    {title}
                  </h2>
                ) : (
                  <span />
                )}
                <div className="flex shrink-0 items-center gap-1.5">
                  {headerAction}
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close panel"
                    className="grid h-8 w-8 place-items-center rounded-lg text-[var(--app-muted)] transition hover:bg-black/5 hover:text-[var(--app-text)] dark:hover:bg-white/8"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </header>
            )}

            <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">{children}</div>

            {!title && !headerAction && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-[var(--app-muted)] transition hover:bg-black/5 hover:text-[var(--app-text)] dark:hover:bg-white/8"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
