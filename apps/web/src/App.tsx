import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { VideoClubHeader } from './components/layout/Navbar'
import { trpc } from './lib/trpc'
import { queryClient, trpcClient } from './lib/trpc-client'
import { AnalyzePage } from './pages/AnalyzePage'
import { HomePage } from './pages/HomePage'
import { ModelMetricsPage } from './pages/ModelMetricsPage'
import { MovieDetailPage } from './pages/MovieDetailPage'

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-paper">
            <VideoClubHeader />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/movie/:id" element={<MovieDetailPage />} />
              <Route path="/analyze" element={<AnalyzePage />} />
              <Route path="/metrics" element={<ModelMetricsPage />} />
            </Routes>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  )
}
