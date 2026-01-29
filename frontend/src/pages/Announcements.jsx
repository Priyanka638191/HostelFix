import { useEffect, useState } from 'react'
import api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Bell, AlertCircle, PlusCircle, X } from 'lucide-react'
import { format } from 'date-fns'

const Announcements = () => {
  const { isAdmin } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_hostel: '',
    target_block: '',
    is_urgent: false
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/announcements/')
      setAnnouncements(response.data)
    } catch (error) {
      toast.error('Failed to fetch announcements')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await api.post('/api/announcements/', {
        ...formData,
        target_hostel: formData.target_hostel || null,
        target_block: formData.target_block || null
      })
      toast.success('Announcement posted!')
      setShowForm(false)
      setFormData({
        title: '',
        content: '',
        target_hostel: '',
        target_block: '',
        is_urgent: false
      })
      fetchAnnouncements()
    } catch (error) {
      toast.error('Failed to post announcement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return

    try {
      await api.delete(`/api/announcements/${id}`)
      toast.success('Announcement deleted')
      fetchAnnouncements()
    } catch (error) {
      toast.error('Failed to delete announcement')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Announcements
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Stay updated with important notices
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            New Announcement
          </button>
        )}
      </div>

      {/* Post Form */}
      {showForm && isAdmin && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Create Announcement
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="input-field"
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Hostel (Optional)
                </label>
                <input
                  type="text"
                  name="target_hostel"
                  value={formData.target_hostel}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Leave empty for all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Block (Optional)
                </label>
                <input
                  type="text"
                  name="target_block"
                  value={formData.target_block}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Leave empty for all"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_urgent"
                id="is_urgent"
                checked={formData.is_urgent}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="is_urgent" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Mark as urgent
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Announcement'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No announcements yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`card ${
                announcement.is_urgent
                  ? 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {announcement.is_urgent && (
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {announcement.title}
                    </h3>
                    {announcement.is_urgent && (
                      <span className="badge bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
                    {announcement.content}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>By {announcement.created_by_name}</span>
                    <span>•</span>
                    <span>{format(new Date(announcement.created_at), 'MMM d, yyyy HH:mm')}</span>
                    {announcement.target_hostel && (
                      <>
                        <span>•</span>
                        <span>For: {announcement.target_hostel}</span>
                        {announcement.target_block && (
                          <span> - {announcement.target_block}</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="ml-4 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Announcements
