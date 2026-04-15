export function PlatformLogo() {
  return (
    <div aria-label="Interactive Lab logo" className="platform-logo" role="img">
      <svg
        aria-hidden="true"
        className="platform-logo-mark"
        viewBox="0 0 96 96"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="platformLogoGradient" x1="15%" x2="85%" y1="15%" y2="85%">
            <stop offset="0%" stopColor="#1c4f8f" />
            <stop offset="55%" stopColor="#153760" />
            <stop offset="100%" stopColor="#ff7a38" />
          </linearGradient>
        </defs>
        <path
          d="M48 10 77 26.5v33L48 86 19 59.5v-33Z"
          fill="url(#platformLogoGradient)"
          opacity="0.98"
        />
        <path
          d="M48 22.5 66 33v20L48 63.5 30 53V33Z"
          fill="none"
          opacity="0.95"
          stroke="#f9fbff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        <path
          d="M30 33 48 44l18-11M48 44v19.5"
          fill="none"
          opacity="0.92"
          stroke="#f9fbff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        <circle cx="71" cy="24" fill="#ffb188" r="6" />
      </svg>

      <div className="platform-logo-type">
        <span className="platform-logo-kicker">Interactive Lab</span>
        <strong>Platform</strong>
      </div>
    </div>
  );
}
