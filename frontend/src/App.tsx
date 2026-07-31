import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import SecurityPage from './pages/SecurityPage'
import ProtectedRoute from './routes/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate to="/dashboard" replace />
          }
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/security"
            element={<SecurityPage />}
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate to="/dashboard" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App