import { motion } from 'framer-motion'
import { CheckCircle, Clock, AlertCircle, XCircle, Circle } from 'lucide-react'
import { format } from 'date-fns'

const statusConfig = {
  reported: { icon: Circle, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/20' },
  assigned: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  in_progress: { icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/20' },
  resolved: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/20' },
  closed: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700' }
}

const IssueTimeline = ({ issue }) => {
  const statuses = ['reported', 'assigned', 'in_progress', 'resolved', 'closed']
  const currentStatusIndex = statuses.indexOf(issue.status)
  
  const calculateTimeInStage = (stageIndex) => {
    if (stageIndex > currentStatusIndex) return null
    
    const now = new Date()
    const created = new Date(issue.created_at)
    
    if (stageIndex === currentStatusIndex) {
      const hours = (now - created) / (1000 * 60 * 60)
      return hours
    }
    
    // For resolved/closed, calculate from resolved_at
    if (issue.resolved_at && stageIndex >= statuses.indexOf('resolved')) {
      const resolved = new Date(issue.resolved_at)
      const created = new Date(issue.created_at)
      return (resolved - created) / (1000 * 60 * 60)
    }
    
    return null
  }

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
      
      {statuses.map((status, index) => {
        const config = statusConfig[status]
        const Icon = config.icon
        const isActive = index <= currentStatusIndex
        const isCurrent = index === currentStatusIndex
        const hoursInStage = calculateTimeInStage(index)
        
        return (
          <motion.div
            key={status}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex items-start gap-4 mb-6 last:mb-0"
          >
            <motion.div
              animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
              className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${
                isActive ? config.bg : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? config.color : 'text-gray-400'}`} />
            </motion.div>
            
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-semibold capitalize ${
                  isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'
                }`}>
                  {status.replace('_', ' ')}
                </h4>
                {isCurrent && (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full"
                  >
                    Current
                  </motion.span>
                )}
              </div>
              
              {hoursInStage !== null && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {hoursInStage < 1 
                    ? `${Math.round(hoursInStage * 60)} minutes`
                    : hoursInStage < 24
                    ? `${Math.round(hoursInStage)} hours`
                    : `${Math.round(hoursInStage / 24)} days`
                  } in this stage
                </p>
              )}
              
              {status === 'resolved' && issue.resolved_at && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Resolved: {format(new Date(issue.resolved_at), 'MMM d, yyyy HH:mm')}
                </p>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default IssueTimeline
