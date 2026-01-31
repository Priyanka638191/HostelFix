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
  User,
  Edit,
  Trash2
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
  const [deleting, setDeleting] = useState(false)

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

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this issue? This action cannot be undone.'
    )
    if (!confirmDelete) return

    try {
      setDeleting(true)
      await api.delete(`/api/v1/issues/${id}`)
      toast.success('Issue deleted successfully')
      navigate('/issues')
    } catch (error) {
      toast.error('Failed to delete issue')
    } finally {
      setDeleting(false)
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
      reported: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
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

  const canDelete =
    isAdmin || issue.created_by === user?.email

  const isLiked = issue.reactions?.likes?.includes(user?.email)
  const isUpvoted = issue.reactions?.upvotes?.includes(user?.email)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/issues"
        className="inline-flex items-center text-primary-600 hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Issues
      </Link>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-3">{issue.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`badge ${getStatusColor(issue.status)}`}>
                {issue.status.replace('_', ' ')}
              </span>
              <span className={`badge ${getPriorityColor(issue.priority)}`}>
                {issue.priority}
              </span>
              <span className="text-sm text-gray-500">
                {issue.category}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {isAdmin && (
              <Link
                to={`/admin/issues/${id}`}
                className="btn-secondary flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" />
                Manage
              </Link>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>

        {issue.image_url && (
          <img
            src={issue.image_url}
            alt={issue.title}
            className="w-full h-64 object-cover rounded-lg mb-4"
          />
        )}

        <p className="whitespace-pre-wrap mb-6">
          {issue.description}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-500">Reported by</p>
            <p className="font-medium">{issue.created_by_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Location</p>
            <p className="font-medium">
              {issue.hostel || 'N/A'} {issue.block && `- ${issue.block}`} {issue.room && `- ${issue.room}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Created</p>
            <p className="font-medium">
              {format(new Date(issue.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {issue.is_public && (
          <div className="flex gap-4 mt-6 pt-6 border-t">
            <button onClick={() => handleReaction('like')} className="btn-secondary">
              <ThumbsUp className="w-4 h-4 mr-1" />
              {issue.reactions?.likes?.length || 0}
            </button>
            <button onClick={() => handleReaction('upvote')} className="btn-secondary">
              <TrendingUp className="w-4 h-4 mr-1" />
              {issue.reactions?.upvotes?.length || 0}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default IssueDetail
