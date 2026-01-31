import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    recent: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/v1/issues/?page=1&limit=50')
      const payload = response.data
      const issues = Array.isArray(payload) ? payload : (payload.issues || [])
      
      const pending = issues.filter(i => !['resolved', 'closed'].includes(i.status))
      const resolved = issues.filter(i => ['resolved', 'closed'].includes(i.status))
      const recent = issues.slice(0, 5)

      setStats({
        total: issues.length,
        pending: pending.length,
        resolved: resolved.length,
        recent
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      reported: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
    return colors[status] || colors.reported
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    }
    return colors[priority] || colors.low
  }

  if (loading) {
    return <div className="animate-pulse">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Here's an overview of your issues
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Issues</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {stats.total}
              </p>
            </div>
            <FileText className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                {stats.pending}
              </p>
            </div>
            <Clock className="w-12 h-12 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {stats.resolved}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolution Rate</p>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">
                {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      </div>

      {/* Recent Issues */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Recent Issues
          </h2>
          <Link
            to="/issues"
            className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium"
          >
            View all
          </Link>
        </div>

        {stats.recent.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No issues yet
            </p>
            <Link to="/issues/create" className="btn-primary inline-block">
              Report an Issue
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.recent.map((issue) => (
              <Link
                key={issue.id}
                to={`/issues/${issue.id}`}
                className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {issue.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {issue.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`badge ${getStatusColor(issue.status)}`}>
                        {issue.status.replace('_', ' ')}
                      </span>
                      <span className={`badge ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(issue.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  {issue.comments?.length > 0 && (
                    <div className="flex items-center text-gray-500 dark:text-gray-400 ml-4">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      <span className="text-sm">{issue.comments.length}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
