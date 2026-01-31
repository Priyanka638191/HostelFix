import { useEffect, useState } from 'react'
import api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Search, PlusCircle, Package, MapPin, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

const LostFound = () => {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    location_found: '',
    location_lost: '',
    item_type: 'found',
    image_url: null
  })
  const [imageFile, setImageFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchItems()
  }, [filter])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const params = filter ? `?item_type=${filter}` : ''
      const response = await api.get(`/api/lost-found/${params}`)
      setItems(response.data)
    } catch (error) {
      toast.error('Failed to fetch items')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImageFile(file)
    const imgForm = new FormData()
    imgForm.append('file', file)

    try {
      const response = await api.post('/api/lost-found/upload-image', imgForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setFormData({ ...formData, image_url: response.data.image_url })
    } catch {
      toast.error('Failed to upload image')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await api.post('/api/lost-found/', formData)
      toast.success('Item posted successfully!')
      setShowForm(false)
      setFormData({
        item_name: '',
        description: '',
        location_found: '',
        location_lost: '',
        item_type: 'found',
        image_url: null
      })
      fetchItems()
    } catch {
      toast.error('Failed to post item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClaim = async (itemId) => {
    if (!window.confirm('Are you sure you want to claim this item?')) return

    try {
      await api.post(`/api/lost-found/${itemId}/claim`)
      toast.success('Claim submitted! Admin will verify.')
      fetchItems()
    } catch {
      toast.error('Failed to claim item')
    }
  }

  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this item? This action cannot be undone.')) return

    try {
      setDeletingId(itemId)
      await api.delete(`/api/lost-found/${itemId}`)
      toast.success('Item deleted')
      fetchItems()
    } catch {
      toast.error('Failed to delete item')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lost & Found</h1>
          <p className="text-gray-600 mt-2">
            Report lost items or claim found items
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Post Item
        </button>
      </div>

      {/* Filters */}
      <div className="card flex gap-4">
        {['', 'lost', 'found'].map((type) => (
          <button
            key={type || 'all'}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg ${
              filter === type
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {type || 'All'}
          </button>
        ))}
      </div>

      {/* Post Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Post Item</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              placeholder="Item name"
              className="input-field"
              required
            />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description"
              className="input-field"
              required
            />
            <select
              name="item_type"
              value={formData.item_type}
              onChange={handleChange}
              className="input-field"
            >
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            <div className="flex gap-4">
              <button className="btn-primary" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const canDelete =
              user?.role === 'admin' || item.created_by === user?.email

            return (
              <div key={item.id} className="card">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.item_name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}

                <div className="flex justify-between items-start mb-2">
                  <span className="badge">
                    {item.item_type}
                  </span>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="text-lg font-semibold mb-2">{item.item_name}</h3>
                <p className="text-sm mb-2">{item.description}</p>

                <p className="text-xs text-gray-500 mb-4">
                  Posted by {item.created_by_name} •{' '}
                  {format(new Date(item.created_at), 'MMM d, yyyy')}
                </p>

                {!item.is_resolved && item.item_type === 'found' && (
                  <button
                    onClick={() => handleClaim(item.id)}
                    className="btn-primary w-full"
                  >
                    Claim Item
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LostFound
