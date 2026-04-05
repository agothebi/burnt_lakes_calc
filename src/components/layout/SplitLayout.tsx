import type { ReactNode } from 'react'

interface SplitLayoutProps {
  left: ReactNode
  right: ReactNode
}

/**
 * Full-viewport split layout — never causes page-level scroll.
 *
 * Desktop (md+): 40/60 side-by-side. Lake on left, questions on right.
 * Mobile (<md):  Stacked. Questions on top (60%), lake on bottom (40%).
 *
 * The right panel uses the min-h-full inner wrapper trick so content is
 * vertically centered when short, and scrolls internally when tall.
 */
export function SplitLayout({ left, right }: SplitLayoutProps) {
  return (
    <div className="h-dvh overflow-hidden flex flex-col md:flex-row">

      {/* Questions panel — top on mobile, right on desktop */}
      <div className="
        order-1 md:order-2
        flex-[3] md:flex-1
        min-h-0 overflow-y-auto
      ">
        <div className="
          min-h-full flex flex-col justify-center
          px-5 py-6 md:px-12 md:py-10
        ">
          {right}
        </div>
      </div>

      {/* Lake panel — bottom on mobile, left on desktop */}
      <div className="
        order-2 md:order-1
        flex-[2] md:flex-none md:w-[40%]
        min-h-0 overflow-hidden
      ">
        {left}
      </div>

    </div>
  )
}
