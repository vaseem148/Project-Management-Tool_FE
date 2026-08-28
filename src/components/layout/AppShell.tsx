import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'

/** Fixed decorative background — sits behind everything, never intercepts input. */
function ShellBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-[0.35] dark:opacity-25" />
      <div className="absolute -left-40 -top-48 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(124,77,255,0.20),transparent_68%)] blur-2xl" />
      <div className="absolute -right-52 top-24 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.16),transparent_68%)] blur-2xl" />
      <div className="absolute bottom-[-18rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.14),transparent_70%)] blur-2xl" />
    </div>
  )
}

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const location = useLocation()

  // Route changes always dismiss the mobile slide-over.
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Keep the slide-over from scrolling the page underneath it.
  useEffect(() => {
    if (!sidebarOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [sidebarOpen])

  return (
    <div className="relative flex min-h-screen w-full">
      <ShellBackdrop />

      <Sidebar className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:flex" />

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              key="sidebar-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="fixed inset-y-0 left-0 z-50 w-[264px] lg:hidden"
            >
              <Sidebar
                className="h-full w-full"
                onNavigate={() => setSidebarOpen(false)}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[264px]">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} onOpenSearch={() => setPaletteOpen(true)} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-6">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}
