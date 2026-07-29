import { Navigate, Outlet } from 'react-router-dom'

function ProtectedRoute() {
  const token =
    localStorage.getItem('flowops_token') ??
    sessionStorage.getItem('flowops_token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute