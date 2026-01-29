import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

const statusOptions = [
  { value: 'reported', label: 'Reported' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const AdminIssueDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    status: '',
    assigned_to: '',
    remarks: '',
  })

  useEffect(() => {
    fetchIssue()
  }, [id])

  const fetchIssue = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/api/v1/issues/${id}`)
      setIssue(response.data)
      setForm({
        status: response.data.status,
        assigned_to: response.data.assigned_to || '',
        remarks: response.data.remarks || '',
      })
    } catch (error) {
      toast.error('Failed to fetch issue')
      navigate('/admin')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.put(`/api/v1/issues/${id}`, {
        status: form.status,
        assigned_to: form.assigned_to || null,
        remarks: form.remarks || null,
      })
      toast.success('Issue updated')
      fetchIssue()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update issue')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    )
  }

  if (!issue) return null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/admin"
          className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Dashboard
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Issue ID:</span>
          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {issue.id}
          </span>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {issue.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {issue.category} • {issue.priority}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Reported by {issue.created_by_name} on {format(new Date(issue.created_at), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {issue.hostel || 'N/A'} {issue.block && `• ${issue.block}`} {issue.room && `• ${issue.room}`}
            </p>
          </div>
        </div>

        {issue.image_url && (
          <img
            src={issue.image_url}
            alt={issue.title}
            className="w-full h-64 object-cover rounded-lg"
          />
        )}

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {issue.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="input-field"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assigned To (email or name)
            </label>
            <input
              type="text"
              name="assigned_to"
              value={form.assigned_to}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., caretaker@hostel.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Remarks
            </label>
            <input
              type="text"
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              className="input-field"
              placeholder="Add admin remarks"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminIssueDetail
