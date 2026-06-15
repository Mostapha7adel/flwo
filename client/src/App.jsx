import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from './lib/queryClient'
import { useAuthStore } from './store/authStore'
import { AppRouter } from './router'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

function AuthInitializer({ children }) {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return children
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthInitializer>
          <AppRouter />
          <Toaster
            position="top-left"
            toastOptions={{
              duration: 3000,
              style: { fontFamily: 'Cairo, sans-serif', direction: 'rtl' },
            }}
          />
        </AuthInitializer>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
