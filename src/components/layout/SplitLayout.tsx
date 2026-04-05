import type { ReactNode } from 'react'
import type { WizardStep } from '../../hooks/useWizard'

interface SplitLayoutProps {
  left: ReactNode
  right: ReactNode
  step?: WizardStep
}

/**
 * Full-viewport split layout — never causes page-level scroll.
 *
 * Desktop (md+): 40/60 side-by-side. Lake left, questions right.
 *
 * Mobile (<md):
 * - Questions on top (flex-1), lake strip fixed at h-52 (208px) on bottom.
 * - On `loading` and `results` steps, the lake is hidden entirely so
 *   those screens get the full viewport to breathe.
 *
 * h-52 (208px) at 390px container width shows SVG Y=213–426 via
 * xMidYMid slice: mountain peaks + full treeline + water surface range —
 * the most visually interesting panoramic slice.
 */
export function SplitLayout({ left, right, step }: SplitLayoutProps) {
  const mobileHideLake = step === 'results' || step === 'loading'

  return (
    <div className="h-dvh overflow-hidden flex flex-col md:flex-row">

      {/* Questions panel — top on mobile, right on desktop */}
      <div className="
        order-1 md:order-2
        flex-1 md:flex-1
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
      <div className={`
        order-2 md:order-1
        md:block md:flex-none md:w-[40%]
        min-h-0 overflow-hidden
        ${mobileHideLake ? 'hidden' : 'h-52 flex-none'}
      `}>
        {left}
      </div>

    </div>
  )
}
