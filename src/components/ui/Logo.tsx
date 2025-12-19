export function YunJianLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 圆角方形背景 */}
      <rect x="8" y="8" width="104" height="104" rx="22" fill="#22C55E" />

      {/* 大云朵 - 占满宽度，位于下方 */}
      <path
        d="M18 75C18 65.059 26.059 57 36 57C37.8 57 39.536 57.268 41.164 57.768C44.778 50.022 52.618 45 61.6 45C73.096 45 82.528 53.56 83.808 64.616C84.4 64.486 85.014 64.416 85.646 64.416C92.718 64.416 98.454 70.152 98.454 77.224C98.454 84.296 92.718 90.032 85.646 90.032H36C26.059 90.032 18 81.973 18 72.032V75Z"
        fill="white"
        opacity="0.95"
      />

      {/* 便签 1 - 左侧，小角度倾斜 */}
      <g transform="translate(22, 18) rotate(-8)">
        <rect width="14" height="18" rx="2" fill="white" opacity="0.6" />
        <rect y="0" width="14" height="3" rx="1" fill="#BBF7D0" />
        <line x1="2.5" y1="8" x2="11" y2="8" stroke="#22C55E" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
        <line x1="2.5" y1="11" x2="9" y2="11" stroke="#22C55E" strokeWidth="1" strokeLinecap="round" opacity="0.2" />
      </g>

      {/* 便签 2 - 中左，微微倾斜 */}
      <g transform="translate(40, 24) rotate(-3)">
        <rect width="18" height="22" rx="2" fill="white" opacity="0.75" />
        <rect y="0" width="18" height="4" rx="1" fill="#FECACA" />
        <line x1="3" y1="9" x2="15" y2="9" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
        <line x1="3" y1="13" x2="12" y2="13" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" opacity="0.25" />
      </g>

      {/* 便签 3 - 中间偏右，最大最近云朵 */}
      <g transform="translate(62, 32) rotate(2)">
        <rect width="22" height="28" rx="2" fill="white" opacity="0.9" />
        <rect y="0" width="22" height="5" rx="1.5" fill="#FDE68A" />
        <line x1="4" y1="11" x2="18" y2="11" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <line x1="4" y1="16" x2="15" y2="16" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        <line x1="4" y1="21" x2="12" y2="21" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
      </g>

      {/* 便签 4 - 右侧，小角度倾斜 */}
      <g transform="translate(88, 20) rotate(6)">
        <rect width="16" height="20" rx="2" fill="white" opacity="0.7" />
        <rect y="0" width="16" height="4" rx="1" fill="#DDD6FE" />
        <line x1="3" y1="9" x2="13" y2="9" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
        <line x1="3" y1="13" x2="10" y2="13" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" opacity="0.2" />
      </g>
    </svg>
  );
}

export function YunJianLogoWithText({ size = 80 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <YunJianLogo size={size} />
      <div className="flex flex-col">
        <span className="text-2xl font-semibold tracking-wide" style={{ color: "#22C55E" }}>
          云笺
        </span>
        <span className="text-xs tracking-widest text-gray-400 uppercase">YunJian</span>
      </div>
    </div>
  );
}
