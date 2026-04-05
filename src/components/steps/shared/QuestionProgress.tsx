interface QuestionProgressProps {
  current: number  // 1-indexed
  total: number
}

export function QuestionProgress({ current, total }: QuestionProgressProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: i === current - 1 ? '24px' : '8px',
              background: i < current ? '#FF6B6B' : '#1A1A2E20',
            }}
          />
        ))}
      </div>
      <span className="font-body text-xs text-[#1A1A2E]/40 font-semibold">
        {current} of {total}
      </span>
    </div>
  )
}
