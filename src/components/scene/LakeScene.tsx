import { useCallback } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import {
  interpolateStops,
  STOPS,
  waterSurfaceY,
  sunCY,
  cloudOpacity,
  emberOpacity,
  reedScaleY,
  shimmerOpacity,
} from './sceneUtils'

interface LakeSceneProps {
  progress: number  // 0–1 from useBurnProgress
}

// Tree definition: position + size
const TREES_FAR = [
  { x: 30,  y: 310, h: 62, w: 36 },
  { x: 78,  y: 318, h: 52, w: 30 },
  { x: 130, y: 306, h: 70, w: 40 },
  { x: 188, y: 312, h: 58, w: 34 },
  { x: 248, y: 304, h: 68, w: 38 },
  { x: 305, y: 314, h: 55, w: 32 },
  { x: 358, y: 308, h: 65, w: 37 },
  { x: 398, y: 316, h: 50, w: 28 },
]

const TREES_NEAR = [
  { x: -8,  y: 348, h: 80, w: 46 },
  { x: 52,  y: 352, h: 72, w: 42 },
  { x: 330, y: 345, h: 82, w: 48 },
  { x: 385, y: 350, h: 75, w: 44 },
  { x: 415, y: 354, h: 68, w: 40 },
]

const REED_POSITIONS = [42, 88, 148, 218, 268, 322, 372]

const EMBER_POSITIONS = [
  { x: 65,  baseY: 420, delay: 0 },
  { x: 148, baseY: 440, delay: 0.6 },
  { x: 235, baseY: 430, delay: 1.1 },
  { x: 318, baseY: 445, delay: 0.3 },
  { x: 375, baseY: 425, delay: 0.9 },
]

const SPRING_COLOR   = { type: 'spring' as const, stiffness: 38, damping: 24 }
const SPRING_POS     = { type: 'spring' as const, stiffness: 28, damping: 22 }
const SPRING_OPACITY = { type: 'spring' as const, stiffness: 42, damping: 26 }

export function LakeScene({ progress }: LakeSceneProps) {
  // ── Mouse parallax ──────────────────────────────────────────────────────────
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const smoothX = useSpring(rawX, { stiffness: 55, damping: 22 })
  const smoothY = useSpring(rawY, { stiffness: 55, damping: 22 })

  // Per-layer transforms (called unconditionally per React rules)
  const cloudsX    = useTransform(smoothX, v => v * 7)
  const cloudsY    = useTransform(smoothY, v => v * 2)
  const mtnFarX    = useTransform(smoothX, v => v * 11)
  const mtnFarY    = useTransform(smoothY, v => v * 4)
  const mtnNearX   = useTransform(smoothX, v => v * 15)
  const mtnNearY   = useTransform(smoothY, v => v * 5)
  const treeFarX   = useTransform(smoothX, v => v * 18)
  const treeFarY   = useTransform(smoothY, v => v * 6)
  const treeNearX  = useTransform(smoothX, v => v * 24)
  const treeNearY  = useTransform(smoothY, v => v * 8)
  const waterX     = useTransform(smoothX, v => v * 9)
  const waterY_mv  = useTransform(smoothY, v => v * 3)
  const reedsX     = useTransform(smoothX, v => v * 30)
  const reedsY     = useTransform(smoothY, v => v * 10)
  const shoreX     = useTransform(smoothX, v => v * 34)
  const shoreY_mv  = useTransform(smoothY, v => v * 12)
  const fgX        = useTransform(smoothX, v => v * 40)
  const fgY        = useTransform(smoothY, v => v * 15)
  const embersX    = useTransform(smoothX, v => v * 44)
  const embersY    = useTransform(smoothY, v => v * 17)
  const sunX_prlx  = useTransform(smoothX, v => v * 4)
  const sunY_prlx  = useTransform(smoothY, v => v * 3)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    rawX.set((e.clientX - rect.left) / rect.width - 0.5)
    rawY.set((e.clientY - rect.top) / rect.height - 0.5)
  }, [rawX, rawY])

  const handleMouseLeave = useCallback(() => {
    rawX.set(0)
    rawY.set(0)
  }, [rawX, rawY])

  // ── Derived colors ──────────────────────────────────────────────────────────
  const skyTopColor   = interpolateStops(STOPS.skyTop,      progress)
  const skyBotColor   = interpolateStops(STOPS.skyBot,      progress)
  const sunColor      = interpolateStops(STOPS.sun,         progress)
  const mtnFarColor   = interpolateStops(STOPS.mountainFar, progress)
  const mtnNearColor  = interpolateStops(STOPS.mountainNear,progress)
  const treeFarColor  = interpolateStops(STOPS.treeFar,     progress)
  const treeNearColor = interpolateStops(STOPS.treeNear,    progress)
  const trunkColor    = interpolateStops(STOPS.treeTrunk,   progress)
  const waterColor    = interpolateStops(STOPS.water,       progress)
  const shimmerColor  = interpolateStops(STOPS.waterShimmer,progress)
  const lakebedColor  = interpolateStops(STOPS.lakebed,     progress)
  const reedColor     = interpolateStops(STOPS.reed,        progress)
  const shoreColor    = interpolateStops(STOPS.shore,       progress)
  const fgColor       = interpolateStops(STOPS.foreground,  progress)
  const emberColor    = interpolateStops(STOPS.ember,       progress)

  // ── Derived scalars ─────────────────────────────────────────────────────────
  const waterY   = waterSurfaceY(progress)
  const sunY     = sunCY(progress)
  const clouds   = cloudOpacity(progress)
  const embers   = emberOpacity(progress)
  const reedSY   = reedScaleY(progress)
  const shimmer  = shimmerOpacity(progress)

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        viewBox="0 0 400 650"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skyTopColor} />
            <stop offset="100%" stopColor={skyBotColor} />
          </linearGradient>
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,200,0.35)" />
            <stop offset="100%" stopColor="rgba(255,200,100,0)" />
          </radialGradient>
        </defs>

        {/* ── Sky ───────────────────────────────────────────────────────── */}
        <motion.rect
          x="-10" y="-10" width="420" height="670"
          fill="url(#skyGrad)"
          animate={{ fill: 'url(#skyGrad)' }}
        />
        {/* Re-draw gradient stops reactively */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={skyTopColor} />
            <stop offset="100%" stopColor={skyBotColor} />
          </linearGradient>
        </defs>

        {/* ── Sun ───────────────────────────────────────────────────────── */}
        <motion.g style={{ x: sunX_prlx, y: sunY_prlx }}>
          {/* Glow halo */}
          <motion.circle
            cx={305} cy={sunY} r={58}
            fill="url(#sunGlow)"
            animate={{ cy: sunY, opacity: Math.max(0, 1 - progress * 1.8) }}
            transition={SPRING_POS}
          />
          {/* Sun disc */}
          <motion.circle
            cx={305} cy={sunY} r={32}
            animate={{ fill: sunColor, cy: sunY }}
            transition={{ ...SPRING_COLOR, cy: SPRING_POS }}
          />
        </motion.g>

        {/* ── Clouds ────────────────────────────────────────────────────── */}
        <motion.g style={{ x: cloudsX, y: cloudsY }}>
          <motion.g animate={{ opacity: clouds }} transition={SPRING_OPACITY}>
            {/* Cloud 1 */}
            <circle cx={72}  cy={108} r={22} fill="rgba(255,255,255,0.88)" />
            <circle cx={98}  cy={98}  r={30} fill="rgba(255,255,255,0.92)" />
            <circle cx={124} cy={105} r={20} fill="rgba(255,255,255,0.88)" />
            {/* Cloud 2 */}
            <circle cx={228} cy={72}  r={18} fill="rgba(255,255,255,0.82)" />
            <circle cx={252} cy={62}  r={26} fill="rgba(255,255,255,0.86)" />
            <circle cx={275} cy={69}  r={18} fill="rgba(255,255,255,0.82)" />
            {/* Cloud 3 (small) */}
            <circle cx={158} cy={52}  r={12} fill="rgba(255,255,255,0.70)" />
            <circle cx={174} cy={46}  r={16} fill="rgba(255,255,255,0.74)" />
            <circle cx={190} cy={52}  r={12} fill="rgba(255,255,255,0.70)" />
          </motion.g>
        </motion.g>

        {/* ── Far mountains ─────────────────────────────────────────────── */}
        <motion.g style={{ x: mtnFarX, y: mtnFarY }}>
          <motion.path
            d="M-20,360 C40,238 100,260 175,218 C240,182 310,204 440,198 L440,375 L-20,375 Z"
            animate={{ fill: mtnFarColor }}
            transition={SPRING_COLOR}
          />
        </motion.g>

        {/* ── Near mountains ────────────────────────────────────────────── */}
        <motion.g style={{ x: mtnNearX, y: mtnNearY }}>
          <motion.path
            d="M-20,375 C30,278 95,295 165,260 C228,232 295,252 365,240 C395,234 420,238 440,235 L440,390 L-20,390 Z"
            animate={{ fill: mtnNearColor }}
            transition={SPRING_COLOR}
          />
        </motion.g>

        {/* ── Far treeline (silhouette path) ────────────────────────────── */}
        <motion.g style={{ x: treeFarX, y: treeFarY }}>
          <motion.path
            d="M-20,348 C15,320 35,334 58,316 C78,300 95,318 118,304 C140,290 160,308 185,296 C208,284 228,300 255,290 C278,280 300,295 325,286 C348,278 368,292 390,284 L440,310 L440,360 L-20,360 Z"
            animate={{ fill: treeFarColor }}
            transition={SPRING_COLOR}
          />
        </motion.g>

        {/* ── Individual far-bank trees ─────────────────────────────────── */}
        <motion.g style={{ x: treeFarX, y: treeFarY }}>
          {TREES_FAR.map((t, i) => (
            <g key={i}>
              <motion.polygon
                points={`${t.x},${t.y - t.h} ${t.x - t.w / 2},${t.y} ${t.x + t.w / 2},${t.y}`}
                animate={{ fill: treeFarColor }}
                transition={SPRING_COLOR}
              />
              <motion.polygon
                points={`${t.x},${t.y - t.h * 0.62} ${t.x - t.w * 0.38},${t.y - t.h * 0.22} ${t.x + t.w * 0.38},${t.y - t.h * 0.22}`}
                animate={{ fill: treeFarColor }}
                transition={SPRING_COLOR}
                opacity={0.82}
              />
              <motion.rect
                x={t.x - 3} y={t.y} width={6} height={t.h * 0.18}
                animate={{ fill: trunkColor }}
                transition={SPRING_COLOR}
              />
            </g>
          ))}
        </motion.g>

        {/* ── Near trees (sides of frame) ───────────────────────────────── */}
        <motion.g style={{ x: treeNearX, y: treeNearY }}>
          {TREES_NEAR.map((t, i) => (
            <g key={i}>
              <motion.polygon
                points={`${t.x},${t.y - t.h} ${t.x - t.w / 2},${t.y} ${t.x + t.w / 2},${t.y}`}
                animate={{ fill: treeNearColor }}
                transition={SPRING_COLOR}
              />
              <motion.polygon
                points={`${t.x},${t.y - t.h * 0.6} ${t.x - t.w * 0.4},${t.y - t.h * 0.18} ${t.x + t.w * 0.4},${t.y - t.h * 0.18}`}
                animate={{ fill: treeNearColor }}
                transition={SPRING_COLOR}
                opacity={0.85}
              />
              <motion.polygon
                points={`${t.x},${t.y - t.h * 0.35} ${t.x - t.w * 0.28},${t.y - t.h * 0.06} ${t.x + t.w * 0.28},${t.y - t.h * 0.06}`}
                animate={{ fill: treeNearColor }}
                transition={SPRING_COLOR}
                opacity={0.72}
              />
              <motion.rect
                x={t.x - 4} y={t.y} width={8} height={t.h * 0.2}
                animate={{ fill: trunkColor }}
                transition={SPRING_COLOR}
              />
            </g>
          ))}
        </motion.g>

        {/* ── Lake bed (revealed as water drops) ───────────────────────── */}
        <motion.g style={{ x: waterX, y: waterY_mv }}>
          <motion.rect
            x="-20" y={360} width="440" height="160"
            animate={{ fill: lakebedColor }}
            transition={SPRING_COLOR}
          />
          {/* Cracked earth lines (appear when progress > 0.5) */}
          <motion.g animate={{ opacity: Math.max(0, (progress - 0.5) * 3) }} transition={SPRING_OPACITY}>
            <line x1="60"  y1="390" x2="95"  y2="412" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="140" y1="405" x2="168" y2="388" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="220" y1="395" x2="258" y2="418" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="300" y1="408" x2="330" y2="392" stroke="rgba(0,0,0,0.14)" strokeWidth="1.2" strokeLinecap="round" />
          </motion.g>

          {/* Lake water surface */}
          <motion.rect
            x="-20" y={0} width="440" height="650"
            animate={{ fill: waterColor, y: waterY }}
            transition={{ ...SPRING_COLOR, y: SPRING_POS }}
          />

          {/* Shimmer lines on water surface */}
          <motion.g animate={{ opacity: shimmer }} transition={SPRING_OPACITY}>
            {[0, 1, 2].map(i => (
              <motion.line
                key={i}
                x1={50 + i * 90}  y1={waterY + 18 + i * 14}
                x2={120 + i * 90} y2={waterY + 18 + i * 14}
                animate={{
                  stroke: shimmerColor,
                  y1: waterY + 18 + i * 14,
                  y2: waterY + 18 + i * 14,
                }}
                transition={{ ...SPRING_COLOR, y1: SPRING_POS, y2: SPRING_POS }}
                strokeWidth={2.5} strokeLinecap="round"
              />
            ))}
          </motion.g>
        </motion.g>

        {/* ── Reeds ─────────────────────────────────────────────────────── */}
        <motion.g style={{ x: reedsX, y: reedsY }}>
          {REED_POSITIONS.map((rx, i) => {
            const reedBase = waterSurfaceY(progress) + 5
            const reedTip  = reedBase - 65
            const sway = i % 2 === 0 ? 6 : -6
            return (
              <motion.g
                key={i}
                style={{ originX: `${rx}px`, originY: `${reedBase}px` }}
                animate={{ scaleY: reedSY }}
                transition={SPRING_POS}
              >
                <motion.path
                  d={`M ${rx},${reedBase} C ${rx + sway * 0.4},${reedBase - 25} ${rx + sway * 0.6},${reedBase - 42} ${rx + sway},${reedTip}`}
                  animate={{ fill: 'none', stroke: reedColor, d: `M ${rx},${reedBase} C ${rx + sway * 0.4},${reedBase - 25} ${rx + sway * 0.6},${reedBase - 42} ${rx + sway},${reedTip}` }}
                  transition={SPRING_COLOR}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Reed head (oval) */}
                <motion.ellipse
                  cx={rx + sway} cy={reedTip - 6} rx={4} ry={8}
                  animate={{ fill: reedColor }}
                  transition={SPRING_COLOR}
                />
              </motion.g>
            )
          })}
        </motion.g>

        {/* ── Shore ─────────────────────────────────────────────────────── */}
        <motion.g style={{ x: shoreX, y: shoreY_mv }}>
          <motion.path
            d="M-20,490 C40,478 90,488 150,480 C210,472 270,484 330,476 C370,470 405,478 440,474 L440,520 L-20,520 Z"
            animate={{ fill: shoreColor }}
            transition={SPRING_COLOR}
          />
          {/* Shore pebbles */}
          {[35, 90, 155, 218, 280, 340, 390].map((px, i) => (
            <motion.ellipse
              key={i}
              cx={px} cy={492 + (i % 3) * 5}
              rx={i % 2 === 0 ? 7 : 5} ry={3.5}
              animate={{ fill: shoreColor, opacity: 0.7 }}
              transition={SPRING_COLOR}
            />
          ))}
        </motion.g>

        {/* ── Foreground (grass + earth) ────────────────────────────────── */}
        <motion.g style={{ x: fgX, y: fgY }}>
          {/* Main foreground band */}
          <motion.path
            d="M-20,530 C30,518 80,526 140,520 C200,514 260,524 320,518 C360,514 400,520 440,516 L440,660 L-20,660 Z"
            animate={{ fill: fgColor }}
            transition={SPRING_COLOR}
          />
          {/* Foreground rocks */}
          {[
            { cx: 45,  cy: 555, rx: 32, ry: 16 },
            { cx: 178, cy: 548, rx: 28, ry: 14 },
            { cx: 290, cy: 560, rx: 35, ry: 17 },
            { cx: 390, cy: 545, rx: 25, ry: 12 },
          ].map((rock, i) => (
            <motion.ellipse
              key={i}
              cx={rock.cx} cy={rock.cy} rx={rock.rx} ry={rock.ry}
              animate={{ fill: interpolateStops(STOPS.shore, progress) }}
              transition={SPRING_COLOR}
            />
          ))}
          {/* Grass tufts */}
          {[22, 68, 115, 195, 245, 308, 358, 415].map((gx, i) => (
            <motion.g key={i}>
              <motion.line
                x1={gx}     y1={532} x2={gx - 5}  y2={520}
                animate={{ stroke: treeFarColor }}
                transition={SPRING_COLOR}
                strokeWidth={2} strokeLinecap="round"
              />
              <motion.line
                x1={gx + 4} y1={532} x2={gx + 8}  y2={518}
                animate={{ stroke: treeFarColor }}
                transition={SPRING_COLOR}
                strokeWidth={2} strokeLinecap="round"
              />
            </motion.g>
          ))}
        </motion.g>

        {/* ── Embers / fire particles ───────────────────────────────────── */}
        <motion.g style={{ x: embersX, y: embersY }}>
          {EMBER_POSITIONS.map((e, i) => (
            <motion.circle
              key={i}
              cx={e.x} cy={e.baseY} r={i % 2 === 0 ? 5 : 3.5}
              animate={{
                opacity: embers,
                cy: [e.baseY, e.baseY - 22, e.baseY],
                r: [i % 2 === 0 ? 5 : 3.5, i % 2 === 0 ? 3 : 2, i % 2 === 0 ? 5 : 3.5],
                fill: emberColor,
              }}
              transition={{
                opacity: SPRING_OPACITY,
                fill: SPRING_COLOR,
                cy: { duration: 1.8 + e.delay * 0.5, repeat: Infinity, ease: 'easeInOut', delay: e.delay },
                r:  { duration: 1.8 + e.delay * 0.5, repeat: Infinity, ease: 'easeInOut', delay: e.delay },
              }}
            />
          ))}
        </motion.g>

        {/* ── Smoke haze overlay (progress > 0.6) ──────────────────────── */}
        <motion.rect
          x="-10" y="-10" width="420" height="670"
          fill="rgba(80,40,20,1)"
          animate={{ opacity: Math.max(0, (progress - 0.6) * 0.35) }}
          transition={SPRING_OPACITY}
          style={{ pointerEvents: 'none' }}
        />
      </svg>
    </div>
  )
}
