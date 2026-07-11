type IconProps = { size?: number; color?: string; className?: string }

export function BookIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <rect x="8" y="8" width="26" height="32" rx="3" stroke="currentColor" strokeWidth="2.5"/>
      <rect x="10" y="8" width="4" height="32" rx="1" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="16" y1="16" x2="28" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="21" x2="28" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="26" x2="24" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M34 12 L40 8 L40 40 L34 36" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  )
}

export function FireIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <path d="M24 6 C24 6 28 12 26 18 C30 14 32 10 30 6 C36 10 40 18 38 26 C36 34 30 42 24 42 C18 42 10 36 10 28 C10 22 14 18 16 16 C15 22 18 24 20 22 C18 16 20 10 24 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="currentColor" fillOpacity=".15"/>
      <path d="M22 30 C20 28 20 24 22 22 C22 26 25 27 24 30 C26 28 27 24 25 20 C29 23 30 28 28 32 C26 36 20 36 20 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".6"/>
    </svg>
  )
}

export function MonitorIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <rect x="6" y="10" width="36" height="24" rx="3" stroke="currentColor" strokeWidth="2.5"/>
      <rect x="10" y="14" width="28" height="16" rx="1.5" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 38 L32 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M20 34 L18 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M28 34 L30 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="14" y="17" width="8" height="5" rx="1" fill="currentColor" opacity=".3"/>
      <line x1="25" y1="18" x2="32" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
      <line x1="25" y1="21" x2="30" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
    </svg>
  )
}

export function AppliedInfoIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <path d="M8 20 L24 12 L40 20 L24 28 L8 20Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="currentColor" fillOpacity=".12"/>
      <path d="M34 24 L34 34 C34 34 29 38 24 38 C19 38 14 34 14 34 L14 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M40 20 L40 28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="40" cy="30" r="2" fill="currentColor"/>
    </svg>
  )
}

export function LockIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <rect x="12" y="22" width="24" height="18" rx="4" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M16 22 L16 16 C16 11 32 11 32 16 L32 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="24" cy="31" r="3" fill="currentColor" opacity=".4" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="24" y1="33" x2="24" y2="37" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function SeasonSpringIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <circle cx="24" cy="24" r="4" fill="currentColor" opacity=".5"/>
      <ellipse cx="24" cy="13" rx="3.5" ry="5.5" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1.8" transform="rotate(0 24 24)"/>
      <ellipse cx="24" cy="13" rx="3.5" ry="5.5" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1.8" transform="rotate(60 24 24)"/>
      <ellipse cx="24" cy="13" rx="3.5" ry="5.5" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1.8" transform="rotate(120 24 24)"/>
      <ellipse cx="24" cy="13" rx="3.5" ry="5.5" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1.8" transform="rotate(180 24 24)"/>
      <ellipse cx="24" cy="13" rx="3.5" ry="5.5" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1.8" transform="rotate(240 24 24)"/>
      <ellipse cx="24" cy="13" rx="3.5" ry="5.5" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1.8" transform="rotate(300 24 24)"/>
    </svg>
  )
}

export function SeasonAutumnIcon({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <path d="M24 8 C24 8 38 16 36 28 C34 36 28 40 24 40 C20 40 14 36 12 28 C10 16 24 8 24 8Z" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity=".15"/>
      <path d="M24 40 L24 44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 20 C24 20 28 24 26 30" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".5"/>
      <path d="M24 20 C24 20 20 24 22 30" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".5"/>
      <line x1="24" y1="20" x2="24" y2="34" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".5"/>
    </svg>
  )
}

export function HomeIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <path d="M8 24 L24 10 L40 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 20 L13 38 L35 38 L35 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="19" y="28" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity=".15"/>
    </svg>
  )
}

export function ChartIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <line x1="10" y1="38" x2="10" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="10" y1="38" x2="40" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="14" y="26" width="6" height="12" rx="2" fill="currentColor" opacity=".3" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="23" y="18" width="6" height="20" rx="2" fill="currentColor" opacity=".5" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="32" y="12" width="6" height="26" rx="2" fill="currentColor" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  )
}

export function CheckIcon({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity=".1"/>
      <path d="M14 24 L20 31 L34 17" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function PauseIcon({ size = 14, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2.5"/>
      <rect x="17" y="16" width="5" height="16" rx="2" fill="currentColor" opacity=".5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="26" y="16" width="5" height="16" rx="2" fill="currentColor" opacity=".5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

export function KeyboardIcon({ size = 28, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <rect x="5" y="14" width="38" height="22" rx="4" stroke="currentColor" strokeWidth="2.5"/>
      <rect x="10" y="19" width="4" height="4" rx="1" fill="currentColor" opacity=".3" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="17" y="19" width="4" height="4" rx="1" fill="currentColor" opacity=".3" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="24" y="19" width="4" height="4" rx="1" fill="currentColor" opacity=".3" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="31" y="19" width="4" height="4" rx="1" fill="currentColor" opacity=".3" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="10" y="26" width="4" height="4" rx="1" fill="currentColor" opacity=".3" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="17" y="26" width="4" height="4" rx="1" fill="currentColor" opacity=".3" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="24" y="26" width="4" height="4" rx="1" fill="currentColor" opacity=".3" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="31" y="26" width="4" height="4" rx="1" fill="currentColor" opacity=".3" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="14" y="31" width="20" height="3" rx="1.5" fill="currentColor" opacity=".4" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}

export function CPUIcon({ size = 28, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <path d="M24 10 C18 10 12 14 12 20 C12 24 14 26 14 26 C12 27 10 30 12 34 C14 38 18 38 20 37 C21 39 22.5 40 24 40 C25.5 40 27 39 28 37 C30 38 34 38 36 34 C38 30 36 27 34 26 C34 26 36 24 36 20 C36 14 30 10 24 10Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
      <line x1="24" y1="10" x2="24" y2="40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" opacity=".4"/>
      <path d="M17 20 Q20 17 23 20 Q20 23 17 20Z" fill="currentColor" opacity=".25"/>
      <path d="M31 20 Q28 17 25 20 Q28 23 31 20Z" fill="currentColor" opacity=".25"/>
      <path d="M15 28 Q18 25 21 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M33 28 Q30 25 27 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function MonitorDisplayIcon({ size = 28, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <rect x="5" y="8" width="38" height="26" rx="3" stroke="currentColor" strokeWidth="2.5"/>
      <rect x="9" y="12" width="30" height="18" rx="1.5" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="20" y1="38" x2="28" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="24" y1="34" x2="24" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <polyline points="13,26 18,20 23,23 28,16 35,18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity=".6"/>
    </svg>
  )
}

export function MemoryIcon({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2.5"/>
      <rect x="14" y="8" width="14" height="12" rx="2" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="1.8"/>
      <rect x="22" y="10" width="4" height="8" rx="1" fill="currentColor" opacity=".4"/>
      <rect x="12" y="26" width="24" height="10" rx="2" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="1.8"/>
      <line x1="16" y1="29" x2="32" y2="29" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".5"/>
      <line x1="16" y1="32" x2="28" y2="32" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".5"/>
    </svg>
  )
}

export function StorageIcon({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="1.5" opacity=".4"/>
      <circle cx="24" cy="24" r="4" fill="currentColor" opacity=".3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="2" fill="currentColor"/>
    </svg>
  )
}

export function ConfettiIcon({ size = 52, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <path d="M10 38 L20 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M10 38 C12 34 16 34 20 36 C22 37 24 36 24 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
      <rect x="28" y="8" width="4" height="4" rx="1" fill="currentColor" transform="rotate(20 30 10)"/>
      <rect x="36" y="16" width="3" height="3" rx=".5" fill="currentColor" opacity=".6" transform="rotate(-15 37 17)"/>
      <circle cx="32" cy="26" r="2" fill="currentColor" opacity=".7"/>
      <rect x="20" y="10" width="3" height="3" rx=".5" fill="currentColor" opacity=".6" transform="rotate(30 21 11)"/>
      <circle cx="40" cy="30" r="1.5" fill="currentColor" opacity=".6"/>
    </svg>
  )
}

export function FileIcon({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <path d="M12 8 L30 8 L38 16 L38 40 L12 40 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="currentColor" fillOpacity=".08"/>
      <path d="M30 8 L30 16 L38 16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
      <line x1="18" y1="24" x2="32" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".6"/>
      <line x1="18" y1="29" x2="32" y2="29" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".6"/>
      <line x1="18" y1="34" x2="26" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".6"/>
    </svg>
  )
}

export function DocumentIcon({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <rect x="10" y="12" width="28" height="30" rx="3" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity=".06"/>
      <path d="M19 12 L19 8 C19 7 20 6 24 6 C28 6 29 7 29 8 L29 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="16" y="10" width="16" height="6" rx="2" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="16" y1="24" x2="32" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
      <line x1="16" y1="30" x2="32" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
      <line x1="16" y1="36" x2="24" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
    </svg>
  )
}

export function TargetIcon({ size = 14, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="24" cy="24" r="10" stroke="currentColor" strokeWidth="2" opacity=".5"/>
      <circle cx="24" cy="24" r="5" fill="currentColor" opacity=".3" stroke="currentColor" strokeWidth="2"/>
      <line x1="24" y1="4" x2="24" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="44" y1="24" x2="36" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M38 10 L30 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M30 14 L30 18 L34 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function BoltIcon({ size = 14, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <path d="M28 6 L16 26 L22 26 L18 42 L34 20 L27 20 L28 6Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="currentColor" fillOpacity=".15"/>
    </svg>
  )
}

export function BulbIcon({ size = 14, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <path d="M24 8 C18 8 13 13 13 19 C13 23 15 26 18 28 L18 34 L30 34 L30 28 C33 26 35 23 35 19 C35 13 30 8 24 8Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="currentColor" fillOpacity=".12"/>
      <line x1="19" y1="37" x2="29" y2="37" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="40" x2="28" y2="40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 14 L22 20 L25 20 L22 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".6"/>
    </svg>
  )
}

export function WaveIcon({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ color }}>
      <path d="M22 10 L22 26" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M18 13 L18 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M26 13 L26 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M30 16 L30 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M14 22 L14 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M12 28 C12 34 16 38 22 38 C28 38 36 34 36 28 L30 28 L26 28 L22 28 L18 28 L14 28 L12 28Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" fill="currentColor" fillOpacity=".15"/>
    </svg>
  )
}
