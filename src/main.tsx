import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import '@/index.css'
import { queryClient } from '@/lib/queryClient'
import { Toaster } from '@/components/ui/toaster'
import { ScrollToTop } from '@/components/ScrollToTop'
import App from '@/App'
import i18n from './i18n'

// When the language changes, every cached API response (localized enum labels,
// backend messages, etc.) must be refetched with the new X-Locale so the whole
// UI is rendered in the selected language.
i18n.on('languageChanged', () => {
  queryClient.invalidateQueries()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <App />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
