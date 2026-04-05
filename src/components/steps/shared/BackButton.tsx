import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 font-body font-bold text-sm text-[#1A1A2E]/50 hover:text-[#1A1A2E] cursor-pointer border-none bg-transparent p-0 w-fit"
      whileHover={{ x: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <ArrowLeft size={16} />
      Back
    </motion.button>
  )
}
