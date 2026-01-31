import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Search, PlusCircle, Package, MapPin } from 'lucide-react'
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
    if (file) {
      setImageFile(file)
      const formData = new FormData()
      formData.append('file', file)
      try {
        const response = await api.post('/api/lost-found/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setFormData({ ...formData, image_url: response.data.image_url })
      } catch (error) {
        toast.error('Failed to upload image')
      }
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
      setImageFile(null)
      fetchItems()
    } catch (error) {
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
    } catch (error) {
      toast.error('Failed to claim item')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Lost & Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
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
      <div className="card">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === ''
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('lost')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'lost'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Lost
          </button>
          <button
            onClick={() => setFilter('found')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'found'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Found
          </button>
        </div>
      </div>

      {/* Post Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Post {formData.item_type === 'lost' ? 'Lost' : 'Found'} Item
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Item Type
              </label>
              <select
                name="item_type"
                value={formData.item_type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                name="item_name"
                value={formData.item_name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field"
                rows={4}
                required
              />
            </div>

            {formData.item_type === 'found' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location Found
                </label>
                <input
                  type="text"
                  name="location_found"
                  value={formData.location_found}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Near cafeteria"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location Lost
                </label>
                <input
                  type="text"
                  name="location_lost"
                  value={formData.location_lost}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Library"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="input-field"
              />
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg mt-2"
                />
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Item'}
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

      {/* Items List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No items found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="card">
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.item_name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`badge ${
                    item.item_type === 'found'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                  }`}
                >
                  {item.item_type}
                </span>
                {item.is_resolved && (
                  <span className="badge bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    Claimed
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {item.item_name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">
                {item.description}
              </p>
              {item.location_found && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  Found: {item.location_found}
                </div>
              )}
              {item.location_lost && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  Lost: {item.location_lost}
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Posted by {item.created_by_name} • {format(new Date(item.created_at), 'MMM d, yyyy')}
              </p>
              {!item.is_resolved && item.item_type === 'found' && (
                <button
                  onClick={() => handleClaim(item.id)}
                  className="w-full btn-primary"
                >
                  Claim Item
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LostFound
