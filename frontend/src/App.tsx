import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import DepartmentsPage from './pages/DepartmentsPage'
import EmployeesPage from './pages/EmployeesPage'
import LoginPage from './pages/LoginPage'
import SecurityPage from './pages/SecurityPage'
import WorkflowsPage from './pages/WorkflowsPage'
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
            path="/departments"
            element={<DepartmentsPage />}
          />

          <Route
            path="/employees"
            element={<EmployeesPage />}
          />

          <Route
            path="/workflows"
            element={<WorkflowsPage />}
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