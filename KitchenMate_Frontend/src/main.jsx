import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'
import { createLenis } from '@/lib/lenis'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const lenis = createLenis()

lenis.on('scroll', () => {
  // Handle scroll events if needed
})

const root = createRoot(document.getElementById('root'))

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
            },
            success: {
              iconTheme: {
                primary: 'var(--color-secondary)',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--color-primary)',
                secondary: 'white',
              },
            },
          }}
        />
    </QueryClientProvider>
  </StrictMode>
)