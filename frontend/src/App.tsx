import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import ApprovalsPage from './pages/ApprovalsPage'
import DashboardPage from './pages/DashboardPage'
import RequestCollaborationPage from './pages/RequestCollaborationPage'
import RequestTypesPage from './pages/RequestTypesPage'
import InternalRequestsPage from './pages/InternalRequestsPage'
import DepartmentsPage from './pages/DepartmentsPage'
import EmployeesPage from './pages/EmployeesPage'
import NotificationsPage from './pages/NotificationsPage'
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
            path="/notifications"
            element={<NotificationsPage />}
          />
          <Route
  path="/approvals"
  element={<ApprovalsPage />}
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
            path="/request-types"
            element={<RequestTypesPage />}
          />

          <Route
            path="/requests"
            element={<InternalRequestsPage />}
          />
          <Route
            path="/requests/:requestId/collaboration"
            element={<RequestCollaborationPage />}
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