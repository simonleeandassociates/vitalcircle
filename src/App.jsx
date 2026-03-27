import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage           from './pages/AuthPage'
import CheckInPage        from './pages/CheckInPage'
import FamilyDashboard    from './pages/FamilyDashboard'
import MedicationsPage    from './pages/MedicationsPage'
import MessagingPage      from './pages/MessagingPage'
import InviteCodeDisplay  from './components/InviteCodeDisplay'
import JoinFamily         from './components/JoinFamily'

function AppRoutes() {
  const { user, profile, groupStatus, loading } = useAuth()

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
    // Senior without a group → onboarding (InviteCodeDisplay creates the group)
    if (groupStatus && !groupStatus.hasGroup) {
      return (
        <Routes>
          <Route path="/setup" element={<InviteCodeDisplay />} />
          <Route path="*"      element={<Navigate to="/setup" replace />} />
        </Routes>
      )
    }
    return (
      <Routes>
        <Route path="/checkin"     element={<CheckInPage />} />
        <Route path="/medications" element={<MedicationsPage />} />
        <Route path="/messages"    element={<MessagingPage />} />
        <Route path="*"            element={<Navigate to="/checkin" replace />} />
      </Routes>
    )
  }

  // Family member — no group yet → onboarding (JoinFamily joins via invite code)
  if (groupStatus && !groupStatus.hasGroup) {
    return (
      <Routes>
        <Route path="/join" element={<JoinFamily />} />
        <Route path="*"     element={<Navigate to="/join" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/family-dashboard" element={<FamilyDashboard />} />
      <Route path="/medications"      element={<MedicationsPage />} />
      <Route path="/messages"         element={<MessagingPage />} />
      <Route path="*"                 element={<Navigate to="/family-dashboard" replace />} />
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
