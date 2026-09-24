import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { MainLayout } from './layouts/MainLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ConfigurationPage } from './pages/ConfigurationPage'
import { LoginPage } from './pages/LoginPage'
import { PublicCalendarPage } from './pages/PublicCalendarPage'
import { UsersPage } from './pages/UsersPage'
import { AdminRoute } from './routes/AdminRoute'
import { ProtectedRoute } from './routes/ProtectedRoute'
import './services/supabase'

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<PublicCalendarPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/reservas" element={<DashboardPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/usuarios" element={<UsersPage />} />
            <Route path="/configuracion" element={<ConfigurationPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </BrowserRouter>
)

export default App;
