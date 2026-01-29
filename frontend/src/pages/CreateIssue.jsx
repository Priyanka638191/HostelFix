import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Upload, AlertTriangle, X, Sparkles, Info } from 'lucide-react'
import AIAssistedWriting from '../components/AIAssistedWriting'
import AnimatedCard from '../components/AnimatedCard'

const CreateIssue = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'plumbing',
    priority: 'medium',
    is_public: true,
    image_url: null
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData({ ...formData, image_url: null })
  }

  const uploadImage = async () => {
    if (!imageFile) return null

    const formData = new FormData()
    formData.append('file', imageFile)

    try {
      const response = await api.post('/api/v1/issues/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data.image_url
    } catch (error) {
      toast.error('Failed to upload image')
      return null
    }
  }

  const checkDuplicate = async () => {
    if (!formData.title || !formData.description) return

    try {
      setCheckingDuplicate(true)
      const response = await api.post('/api/v1/issues/check-duplicate', formData)
      if (response.data.is_duplicate) {
        setDuplicateWarning(response.data)
      } else {
        setDuplicateWarning(null)
      }
    } catch (error) {
      console.error('Error checking duplicate:', error)
    } finally {
      setCheckingDuplicate(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Upload image if present
      let imageUrl = formData.image_url
      if (imageFile) {
        imageUrl = await uploadImage()
        if (!imageUrl) {
          setLoading(false)
          return
        }
      }

      const issueData = {
        ...formData,
        image_url: imageUrl
      }

      await api.post('/api/v1/issues/', issueData)
      toast.success('Issue reported successfully!')
      navigate('/issues')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create issue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Report an Issue
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Describe the issue you're facing. Our AI will help you write better descriptions.
        </p>
      </motion.div>

      {duplicateWarning && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700"
        >
          <div className="flex items-start">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg text-yellow-900 dark:text-yellow-200">
                  🎯 ML Duplicate Detection Alert
                </h3>
                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-200 dark:bg-yellow-800 rounded-full">
                  <Sparkles className="w-3 h-3 text-yellow-700 dark:text-yellow-300" />
                  <span className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">
                    {duplicateWarning.similarity_percentage || Math.round(duplicateWarning.similarity_score * 100)}% Match
                  </span>
                </div>
              </div>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-4">
                Our AI detected <strong>{duplicateWarning.similar_issues.length} similar issue(s)</strong> using 
                TF-IDF vectorization and cosine similarity. Consider checking these first:
              </p>
              
              <div className="space-y-3 mb-4">
                {duplicateWarning.similar_issues.map((issue, idx) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-yellow-200 dark:border-yellow-700 hover:border-yellow-400 dark:hover:border-yellow-500 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Link
                        to={`/issues/${issue.id}`}
                        className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        {issue.title}
                      </Link>
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs font-bold rounded">
                        {issue.similarity_percentage || Math.round(issue.similarity_score * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {issue.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                        {issue.status}
                      </span>
                      {issue.matching_keywords && issue.matching_keywords.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Info className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-500">Matching: </span>
                          <div className="flex gap-1">
                            {issue.matching_keywords.slice(0, 3).map((keyword, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setDuplicateWarning(null)}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Submit Anyway
                </button>
                <Link
                  to="/issues"
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Browse Existing Issues
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatedCard className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={checkDuplicate}
            className="input-field"
            placeholder="Brief description of the issue"
            required
            minLength={5}
            maxLength={200}
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
            onBlur={checkDuplicate}
            className="input-field"
            rows={6}
            placeholder="Provide detailed information about the issue..."
            required
            minLength={10}
            maxLength={2000}
          />
          {checkingDuplicate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full"
              />
              <span>AI is checking for similar issues...</span>
            </motion.div>
          )}
          
          {/* AI-Assisted Writing Component */}
          {formData.description && !checkingDuplicate && (
            <div className="mt-3">
              <AIAssistedWriting description={formData.description} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="cleaning">Cleaning</option>
              <option value="maintenance">Maintenance</option>
              <option value="security">Security</option>
              <option value="internet">Internet</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority *
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Image (Optional)
          </label>
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-48 h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click to upload or drag and drop
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_public"
            id="is_public"
            checked={formData.is_public}
            onChange={handleChange}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="is_public" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Make this issue public (others can see and comment)
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Issue'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/issues')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
        </form>
      </AnimatedCard>
    </motion.div>
  )
}

export default CreateIssue
