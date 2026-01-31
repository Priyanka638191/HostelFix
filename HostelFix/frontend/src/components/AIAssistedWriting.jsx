import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react'

const AIAssistedWriting = ({ description, onSuggestionClick }) => {
  const [suggestions, setSuggestions] = useState([])
  const [warnings, setWarnings] = useState([])
  const [keywords, setKeywords] = useState([])

  useEffect(() => {
    if (!description) {
      setSuggestions([])
      setWarnings([])
      setKeywords([])
      return
    }

    // Extract keywords (simple implementation)
    const words = description.toLowerCase().match(/\b\w{4,}\b/g) || []
    const commonWords = new Set(['this', 'that', 'there', 'with', 'from', 'have', 'been', 'will', 'would', 'could', 'should'])
    const uniqueKeywords = [...new Set(words.filter(w => !commonWords.has(w)))].slice(0, 10)
    setKeywords(uniqueKeywords)

    // Generate suggestions based on description length and content
    const newSuggestions = []
    const newWarnings = []

    if (description.length < 20) {
      newWarnings.push({
        type: 'warning',
        message: 'Description is too short. Add more details for better issue tracking.',
        icon: AlertTriangle
      })
    }

    if (description.length > 500) {
      newWarnings.push({
        type: 'info',
        message: 'Description is quite long. Consider breaking into bullet points.',
        icon: Lightbulb
      })
    }

    // Check for vague words
    const vagueWords = ['something', 'thing', 'stuff', 'problem', 'issue', 'broken']
    const hasVagueWords = vagueWords.some(word => description.toLowerCase().includes(word))
    
    if (hasVagueWords && description.length < 50) {
      newWarnings.push({
        type: 'warning',
        message: 'Try to be more specific. What exactly is the problem?',
        icon: AlertTriangle
      })
    }

    // Suggest adding location if not present
    const locationWords = ['room', 'floor', 'block', 'hostel', 'bathroom', 'corridor']
    const hasLocation = locationWords.some(word => description.toLowerCase().includes(word))
    
    if (!hasLocation) {
      newSuggestions.push({
        text: 'Add location details (e.g., "Room 201, Block A")',
        type: 'location'
      })
    }

    // Suggest adding urgency if high-priority words present
    const urgentWords = ['urgent', 'emergency', 'critical', 'immediate', 'danger']
    const hasUrgent = urgentWords.some(word => description.toLowerCase().includes(word))
    
    if (hasUrgent) {
      newSuggestions.push({
        text: 'Consider marking this as "High" or "Urgent" priority',
        type: 'priority'
      })
    }

    setSuggestions(newSuggestions)
    setWarnings(newWarnings)
  }, [description])

  if (!description) return null

  return (
    <div className="space-y-3">
      {/* Keywords Highlight */}
      {keywords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Keywords detected (for ML matching):
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <motion.span
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs rounded-full"
              >
                {keyword}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Warnings */}
      <AnimatePresence>
        {warnings.map((warning, index) => {
          const Icon = warning.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={`p-3 rounded-lg border flex items-start gap-2 ${
                warning.type === 'warning'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}
            >
              <Icon className={`w-4 h-4 mt-0.5 ${
                warning.type === 'warning'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`} />
              <p className={`text-sm ${
                warning.type === 'warning'
                  ? 'text-yellow-800 dark:text-yellow-200'
                  : 'text-blue-800 dark:text-blue-200'
              }`}>
                {warning.message}
              </p>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-200">
                Suggestions:
              </span>
            </div>
            <ul className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full"></span>
                  {suggestion.text}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AIAssistedWriting
