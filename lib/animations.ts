import { useReducedMotion, type Variants } from 'framer-motion'
export const slideVariants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 32,
      mass: 1,
    },
  },
  exit: { opacity: 0, x: -16, transition: { duration: 0.18, ease: 'easeIn' } },
}satisfies Variants

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.9,
    },
  },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 320,
      damping: 28,
      mass: 0.9,
    },
  },
}

export const tokenPop = {
  hidden: { opacity: 0, scale: 0.5, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 22,
      mass: 0.8,
    },
  },
}

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.05,
    },
  },
}

export const bannerSlide = {
  hidden: { y: 80, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 360,
      damping: 36,
      mass: 1.1,
    },
  },
}

export function useAnimationVariants() {
  const reduce = useReducedMotion()
  if (reduce) {
    const noop = { hidden: {}, visible: {} }
    return {
      slideVariants: noop,
      fadeUp: noop,
      scaleIn: noop,
      tokenPop: noop,
      staggerContainer: noop,
      bannerSlide: noop,
    }
  }
  return { slideVariants, fadeUp, scaleIn, tokenPop, staggerContainer, bannerSlide }
}
