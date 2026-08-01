import { Navigate } from 'react-router-dom'
import WorkspaceExperience from '../components/layout/WorkspaceExperience'

function ProtectedRoute() {
  const token =
    localStorage.getItem('flowops_token') ??
    sessionStorage.getItem('flowops_token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <WorkspaceExperience />
}

export default ProtectedRoute
