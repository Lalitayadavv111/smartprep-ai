'use client'
import { motion } from 'framer-motion'
import { useAnimationVariants } from '@/lib/animations'

interface Props {
  children: React.ReactNode
  className?: string
  variant?: 'slide' | 'fade'
}

export default function PageWrapper({
  children,
  className = '',
  variant = 'fade',
}: Props) {
  const { slideVariants, fadeUp } = useAnimationVariants()
  const chosen = variant === 'slide' ? slideVariants : fadeUp

  return (
    <motion.div
      variants={chosen}
      initial="hidden"
      animate="visible"
      className={`w-full ${className}`}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  )
}
