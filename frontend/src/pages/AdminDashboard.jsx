import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import {
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Users
} from 'lucide-react'

const AdminDashboard = () => {
  const { isAdmin } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAdmin) {
      fetchStats()
    }
  }, [isAdmin])

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/dashboard')
      setStats(response.data)
    } catch (error) {
      toast.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Access denied. Admin only.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    )
  }

  if (!stats) return null

  // Prepare chart data
  const categoryData = Object.entries(stats.category_distribution || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }))

  const priorityData = Object.entries(stats.priority_distribution || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }))

  const statusData = Object.entries(stats.status_distribution || {}).map(([name, value]) => ({
    name: name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1),
    value
  }))

  const hostelData = Object.entries(stats.hostel_distribution || {}).map(([name, value]) => ({
    name,
    value
  }))

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Analytics and insights
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Issues</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {stats.total_issues}
              </p>
            </div>
            <FileText className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Issues</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                {stats.pending_issues}
              </p>
            </div>
            <Clock className="w-12 h-12 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolved Issues</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {stats.resolved_issues}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Resolution</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {stats.average_resolution_hours?.toFixed(1) || 0}h
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Issues by Category
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Issues by Priority
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Issues by Status
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hostel Distribution */}
        {hostelData.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Issues by Hostel
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hostelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Additional Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Recent Issues (7 days)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {stats.recent_issues_7days}
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Resolution Rate</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
              {stats.total_issues > 0
                ? Math.round((stats.resolved_issues / stats.total_issues) * 100)
                : 0}%
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Block Distribution</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 mt-2">
              {Object.keys(stats.block_distribution || {}).length} blocks
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
