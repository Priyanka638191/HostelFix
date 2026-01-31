import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUser(token)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, role = null) => {
    try {
      const formData = new FormData()
      formData.append('username', email)
      formData.append('password', password)

      // Use role-specific endpoint if role is provided
      const endpoint = role === 'admin' 
        ? `${API_URL}/api/v1/auth/login/admin`
        : role === 'student'
        ? `${API_URL}/api/v1/auth/login/student`
        : `${API_URL}/api/v1/auth/login`

      const response = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })

      const { access_token } = response.data
      localStorage.setItem('token', access_token)
      
      await fetchUser(access_token)
      toast.success('Login successful!')
      return { success: true }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed')
      return { success: false }
    }
  }

  const register = async (userData) => {
    try {
      await axios.post(`${API_URL}/api/v1/auth/register`, userData)
      toast.success('Registration successful! Please login.')
      return { success: true }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed')
      return { success: false }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin'
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
