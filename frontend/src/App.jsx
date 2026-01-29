import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import StudentRoute from './components/StudentRoute'
import LoginStudent from './pages/LoginStudent'
import LoginAdmin from './pages/LoginAdmin'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Issues from './pages/Issues'
import CreateIssue from './pages/CreateIssue'
import IssueDetail from './pages/IssueDetail'
import LostFound from './pages/LostFound'
import Announcements from './pages/Announcements'
import AdminDashboard from './pages/AdminDashboard'
import AdminIssueDetail from './pages/AdminIssueDetail'
import Layout from './components/Layout'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login/student" element={<LoginStudent />} />
          <Route path="/login/admin" element={<LoginAdmin />} />
          <Route path="/login" element={<LoginStudent />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="issues" element={<Issues />} />
            <Route path="issues/create" element={<CreateIssue />} />
            <Route path="issues/:id" element={<IssueDetail />} />
            <Route path="lost-found" element={<StudentRoute><LostFound /></StudentRoute>} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="admin/issues/:id" element={<AdminRoute><AdminIssueDetail /></AdminRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
