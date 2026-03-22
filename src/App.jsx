import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import CheckInPage from './pages/CheckInPage'
import FamilyDashboard from './pages/FamilyDashboard'
import MedicationsPage from './pages/MedicationsPage'
import MessagingPage from './pages/MessagingPage'

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-lg">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    )
  }

  if (profile?.role === 'senior') {
    return (
      <Routes>
        <Route path="/checkin" element={<CheckInPage />} />
        <Route path="/medications" element={<MedicationsPage />} />
        <Route path="/messages" element={<MessagingPage />} />
        <Route path="*" element={<Navigate to="/checkin" replace />} />
      </Routes>
    )
  }

  // Family member routes
  return (
    <Routes>
      <Route path="/family-dashboard" element={<FamilyDashboard />} />
      <Route path="/medications" element={<MedicationsPage />} />
      <Route path="/messages" element={<MessagingPage />} />
      <Route path="*" element={<Navigate to="/family-dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
