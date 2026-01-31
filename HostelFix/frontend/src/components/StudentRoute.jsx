import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const StudentRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login/student" replace />
  }

  if (isAdmin) {
    // Admins can access student routes, but redirect to admin dashboard by default
    return children
  }

  return children
}

export default StudentRoute
