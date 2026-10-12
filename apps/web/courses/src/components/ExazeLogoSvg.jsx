export default function ExazeLogoSvg() {
  return (
    <svg id="nav-s" className="brand-logo h-9 w-8 shrink-0 overflow-visible" viewBox="0 0 625 720" aria-hidden="true">
      <defs>
        <linearGradient id="nav-gb" gradientUnits="userSpaceOnUse" x1="360" y1="20" x2="40" y2="480">
          <stop offset="0" stopColor="#5BB5E8" />
          <stop offset=".45" stopColor="#2F7CC0" />
          <stop offset="1" stopColor="#2F4DA0" />
        </linearGradient>
        <linearGradient id="nav-gg" gradientUnits="userSpaceOnUse" x1="520" y1="240" x2="250" y2="660">
          <stop offset="0" stopColor="#EDEC80" />
          <stop offset=".4" stopColor="#5DB846" />
          <stop offset="1" stopColor="#235F33" />
        </linearGradient>
        <clipPath id="nav-db"><polygon points="410,-300 1400,-300 1400,1400 -300,1400 -300,410" /></clipPath>
        <clipPath id="nav-dg"><polygon points="700,-300 1400,-300 1400,1400 -300,1400 -300,700" /></clipPath>
        <clipPath id="nav-lb"><polygon points="-300,-300 410,-300 -300,410" /></clipPath>
        <clipPath id="nav-lg"><polygon points="-300,-300 700,-300 -300,700" /></clipPath>
        <filter id="nav-sh" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="16" stdDeviation="14" floodColor="#1b3b6b" floodOpacity=".3" />
        </filter>
      </defs>
      <g id="nav-root">
        <g filter="url(#nav-sh)" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path id="nav-b" d="M325 75C250 150 170 230 95 305C55 345 45 400 70 480" stroke="url(#nav-gb)" strokeWidth="118" />
          <path id="nav-g" d="M445 285C385 345 300 420 255 465C195 525 215 620 300 655C360 675 410 650 450 610C490 570 520 530 550 490" stroke="url(#nav-gg)" strokeWidth="132" />
          <path id="nav-m" d="M165 355C165 355 165 355 165 355" stroke="url(#nav-gg)" strokeWidth="0" />
          <g clipPath="url(#nav-db)"><path id="nav-b2" d="M325 75C250 150 170 230 95 305C55 345 45 400 70 480" stroke="#06143a" strokeOpacity=".16" strokeWidth="118" /></g>
          <g clipPath="url(#nav-dg)">
            <path id="nav-g2" d="M445 285C385 345 300 420 255 465C195 525 215 620 300 655C360 675 410 650 450 610C490 570 520 530 550 490" stroke="#031a0a" strokeOpacity=".2" strokeWidth="132" />
            <path id="nav-m2" d="M165 355C165 355 165 355 165 355" stroke="#031a0a" strokeOpacity=".2" strokeWidth="0" />
          </g>
          <g clipPath="url(#nav-lb)"><path id="nav-b3" d="M325 75C250 150 170 230 95 305C55 345 45 400 70 480" stroke="#fff" strokeOpacity=".14" strokeWidth="118" /></g>
          <g clipPath="url(#nav-lg)">
            <path id="nav-g3" d="M445 285C385 345 300 420 255 465C195 525 215 620 300 655C360 675 410 650 450 610C490 570 520 530 550 490" stroke="#fff" strokeOpacity=".16" strokeWidth="132" />
            <path id="nav-m3" d="M165 355C165 355 165 355 165 355" stroke="#fff" strokeOpacity=".16" strokeWidth="0" />
          </g>
        </g>
      </g>
    </svg>
  )
}
