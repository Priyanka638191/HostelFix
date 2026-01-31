import { motion } from 'framer-motion'

const AnimatedCard = ({ children, className = "", delay = 0, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`card ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedCard
