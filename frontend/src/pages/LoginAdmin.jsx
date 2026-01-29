import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import { Shield, Lock, ArrowRight, AlertCircle } from 'lucide-react'

const LoginAdmin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password, 'admin')
    setLoading(false)
    if (result.success) {
      navigate('/admin')
    } else {
      setError('Invalid admin credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 0 0px rgba(59, 130, 246, 0.4)",
                "0 0 0 10px rgba(59, 130, 246, 0)",
                "0 0 0 0px rgba(59, 130, 246, 0)"
              ]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-block p-4 bg-blue-600/10 rounded-full mb-4"
          >
            <Shield className="w-12 h-12 text-blue-500" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Portal
          </h1>
          <p className="text-gray-400 text-sm">
            Secure administrative access
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-gray-700/50"
        >
          <div className="flex items-center gap-2 mb-6 text-gray-400 text-sm">
            <Lock className="w-4 h-4" />
            <span>Restricted Access</span>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                placeholder="admin@hostelfix.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Authenticating...
                </>
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-center text-sm text-gray-400">
              Not an admin?{' '}
              <Link
                to="/login/student"
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                Student Login
              </Link>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-gray-500">
            All access attempts are logged and monitored
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default LoginAdmin
