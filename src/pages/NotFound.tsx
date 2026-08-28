import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, FolderKanban, LayoutDashboard } from 'lucide-react'

import { Button } from '@/components/ui'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="relative flex min-h-[70vh] w-full items-center justify-center px-4 py-16">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-[0.45] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex max-w-lg flex-col items-center text-center"
      >
        <span className="brand-gradient animate-float mb-6 grid h-14 w-14 place-items-center rounded-2xl shadow-[var(--shadow-glow)]">
          <Compass className="h-7 w-7 text-white" aria-hidden="true" />
        </span>

        <p className="brand-text text-7xl font-extrabold leading-none tracking-tighter sm:text-8xl">404</p>

        <h1 className="mt-5 text-xl font-semibold tracking-tight sm:text-2xl">This page went off the board</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The page you were looking for has been moved, renamed, or never existed. Let us get you back to work.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Button leftIcon={<LayoutDashboard />} onClick={() => navigate('/')}>
            Back to dashboard
          </Button>
          <Button variant="secondary" leftIcon={<FolderKanban />} onClick={() => navigate('/projects')}>
            Browse projects
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
