import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  MessageSquare, 
  ThumbsUp, 
  TrendingUp,
  Clock,
  User,
  Edit
} from 'lucide-react'
import { format } from 'date-fns'

const IssueDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchIssue()
  }, [id])

  const fetchIssue = async () => {
    try {
      const response = await api.get(`/api/v1/issues/${id}`)
      setIssue(response.data)
    } catch (error) {
      toast.error('Failed to fetch issue')
      navigate('/issues')
    } finally {
      setLoading(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    try {
      setSubmitting(true)
      await api.post(`/api/v1/issues/${id}/comments`, { content: comment })
      setComment('')
      toast.success('Comment added')
      fetchIssue()
    } catch (error) {
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReaction = async (type) => {
    try {
      await api.post(`/api/v1/issues/${id}/react?reaction_type=${type}`)
      fetchIssue()
    } catch (error) {
      toast.error('Failed to react')
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
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    )
  }

  if (!issue) return null

  const isLiked = issue.reactions?.likes?.includes(user?.email)
  const isUpvoted = issue.reactions?.upvotes?.includes(user?.email)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/issues"
        className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Issues
      </Link>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              {issue.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`badge ${getStatusColor(issue.status)}`}>
                {issue.status.replace('_', ' ')}
              </span>
              <span className={`badge ${getPriorityColor(issue.priority)}`}>
                {issue.priority}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {issue.category}
              </span>
            </div>
          </div>
          {isAdmin && (
            <Link
              to={`/admin/issues/${id}`}
              className="btn-secondary flex items-center"
            >
              <Edit className="w-4 h-4 mr-2" />
              Manage
            </Link>
          )}
        </div>

        {issue.image_url && (
          <img
            src={issue.image_url}
            alt={issue.title}
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
        )}

        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-6">
          {issue.description}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Reported by</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {issue.created_by_name}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {issue.hostel || 'N/A'} {issue.block && `- ${issue.block}`} {issue.room && `- ${issue.room}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {format(new Date(issue.created_at), 'MMM d, yyyy')}
            </p>
          </div>
          {issue.resolved_at && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Resolved</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {format(new Date(issue.resolved_at), 'MMM d, yyyy')}
              </p>
            </div>
          )}
        </div>

        {issue.remarks && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
              Admin Remarks:
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {issue.remarks}
            </p>
          </div>
        )}

        {issue.is_public && (
          <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleReaction('like')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{issue.reactions?.likes?.length || 0}</span>
            </button>
            <button
              onClick={() => handleReaction('upvote')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isUpvoted
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>{issue.reactions?.upvotes?.length || 0}</span>
            </button>
          </div>
        )}
      </div>

      {issue.is_public && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Comments ({issue.comments?.length || 0})
          </h2>

          <form onSubmit={handleComment} className="mb-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input-field mb-3"
              rows={3}
              placeholder="Add a comment..."
            />
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          <div className="space-y-4">
            {issue.comments?.length > 0 ? (
              issue.comments.map((comment, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {comment.created_by_name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {comment.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default IssueDetail
