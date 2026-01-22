/**
 * Animated Logo Components
 *
 * PathDrawingLogo - One-time intro animation with the full logo (box + icon)
 *                   Perfect for splash screens, app launch, welcome screens
 *
 * LogoSpinner - Looping loader with the same drawing style
 *               Perfect for data loading states
 */

// Path Drawing Animation - Full logo with box (ONE-TIME INTRO)
export const PathDrawingLogo = ({ size = 120 }: { size?: number }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="path-drawing-logo"
    >
      <style>{`
        .path-drawing-logo .bg-rect {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .path-drawing-logo .draw-element {
          stroke: #E8F1F7;
          stroke-width: 2;
          fill: transparent;
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: drawPath 0.8s ease-out forwards;
        }
        .path-drawing-logo .fill-element {
          opacity: 0;
          animation: fillIn 0.4s ease-out forwards;
        }
        .path-drawing-logo .el-1 { animation-delay: 0.3s; }
        .path-drawing-logo .el-2 { animation-delay: 0.5s; }
        .path-drawing-logo .el-3 { animation-delay: 0.7s; }
        .path-drawing-logo .el-4 { animation-delay: 0.9s; }
        .path-drawing-logo .el-5 { animation-delay: 1.1s; }
        .path-drawing-logo .el-6 { animation-delay: 1.3s; }
        .path-drawing-logo .el-7 { animation-delay: 1.5s; }

        .path-drawing-logo .fill-1 { animation-delay: 0.8s; }
        .path-drawing-logo .fill-2 { animation-delay: 1.0s; }
        .path-drawing-logo .fill-3 { animation-delay: 1.2s; }
        .path-drawing-logo .fill-4 { animation-delay: 1.4s; }
        .path-drawing-logo .fill-5 { animation-delay: 1.6s; }
        .path-drawing-logo .fill-6 { animation-delay: 1.8s; }
        .path-drawing-logo .fill-7 { animation-delay: 2.0s; }

        @keyframes drawPath {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fillIn {
          to { opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <defs>
        <linearGradient id="paint0_path" x1="90.3108" y1="180" x2="89.6892" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00151E"/>
          <stop offset="1" stopColor="#00080C"/>
        </linearGradient>
      </defs>

      {/* Background */}
      <rect className="bg-rect" width="180" height="180" rx="39.1304" fill="url(#paint0_path)"/>
      <rect className="bg-rect" x="0.5" y="0.5" width="179" height="179" rx="38.6304" stroke="white" strokeOpacity="0.15"/>

      {/* Draw paths */}
      <rect className="draw-element el-1" x="64.236" y="50.4492" width="54.7445" height="16.1983"/>
      <rect className="draw-element el-2" x="64.236" y="81.9009" width="54.7445" height="16.1983"/>
      <rect className="draw-element el-3" x="64.236" y="113.353" width="54.7445" height="16.1983"/>
      <path className="draw-element el-4" d="M118.98 89.73V64.2177V50.7866L132.188 66.6474V81.709L125.685 89.73H118.98Z"/>
      <path className="draw-element el-5" d="M118.98 89.6626V116.12V129.551L132.188 113.324V98.3337L125.632 89.6626H118.98Z"/>
      <rect className="draw-element el-6" x="47.8125" y="66.6475" width="16.4234" height="15.2534"/>
      <rect className="draw-element el-7" x="47.8125" y="98.0991" width="16.4234" height="15.2534"/>

      {/* Fill elements */}
      <rect className="fill-element fill-1" x="64.236" y="50.4492" width="54.7445" height="16.1983" fill="#E8F1F7"/>
      <rect className="fill-element fill-2" x="64.236" y="81.9009" width="54.7445" height="16.1983" fill="#E8F1F7"/>
      <rect className="fill-element fill-3" x="64.236" y="113.353" width="54.7445" height="16.1983" fill="#E8F1F7"/>
      <path className="fill-element fill-4" d="M118.98 89.73V64.2177V50.7866L132.188 66.6474V81.709L125.685 89.73H118.98Z" fill="#E8F1F7"/>
      <path className="fill-element fill-5" d="M118.98 89.6626V116.12V129.551L132.188 113.324V98.3337L125.632 89.6626H118.98Z" fill="#E8F1F7"/>
      <rect className="fill-element fill-6" x="47.8125" y="66.6475" width="16.4234" height="15.2534" fill="#E8F1F7"/>
      <rect className="fill-element fill-7" x="47.8125" y="98.0991" width="16.4234" height="15.2534" fill="#E8F1F7"/>
    </svg>
  );
};

// Looping Spinner with Drawing Style (INFINITE LOOP)
export const LogoSpinner = ({ size = 48, color = "#00C8FF" }: { size?: number; color?: string }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="40 45 100 95"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="logo-spinner"
    >
      <style>{`
        .logo-spinner .draw-loop {
          stroke: ${color};
          stroke-width: 2;
          fill: transparent;
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: drawLoop 2.4s ease-in-out infinite;
        }
        .logo-spinner .fill-loop {
          fill: ${color};
          opacity: 0;
          animation: fillLoop 2.4s ease-in-out infinite;
        }

        .logo-spinner .el-1 { animation-delay: 0s; }
        .logo-spinner .el-2 { animation-delay: 0.15s; }
        .logo-spinner .el-3 { animation-delay: 0.3s; }
        .logo-spinner .el-4 { animation-delay: 0.45s; }
        .logo-spinner .el-5 { animation-delay: 0.6s; }
        .logo-spinner .el-6 { animation-delay: 0.75s; }
        .logo-spinner .el-7 { animation-delay: 0.9s; }

        @keyframes drawLoop {
          0% { stroke-dashoffset: 200; opacity: 1; }
          30% { stroke-dashoffset: 0; opacity: 1; }
          50% { stroke-dashoffset: 0; opacity: 1; }
          80% { stroke-dashoffset: -200; opacity: 0; }
          100% { stroke-dashoffset: 200; opacity: 0; }
        }

        @keyframes fillLoop {
          0% { opacity: 0; }
          25% { opacity: 0; }
          35% { opacity: 1; }
          65% { opacity: 1; }
          80% { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* Draw paths (stroke animation) */}
      <rect className="draw-loop el-1" x="64.236" y="50.4492" width="54.7445" height="16.1983"/>
      <rect className="draw-loop el-2" x="64.236" y="81.9009" width="54.7445" height="16.1983"/>
      <rect className="draw-loop el-3" x="64.236" y="113.353" width="54.7445" height="16.1983"/>
      <path className="draw-loop el-4" d="M118.98 89.73V64.2177V50.7866L132.188 66.6474V81.709L125.685 89.73H118.98Z"/>
      <path className="draw-loop el-5" d="M118.98 89.6626V116.12V129.551L132.188 113.324V98.3337L125.632 89.6626H118.98Z"/>
      <rect className="draw-loop el-6" x="47.8125" y="66.6475" width="16.4234" height="15.2534"/>
      <rect className="draw-loop el-7" x="47.8125" y="98.0991" width="16.4234" height="15.2534"/>

      {/* Fill elements (fade in/out after draw) */}
      <rect className="fill-loop el-1" x="64.236" y="50.4492" width="54.7445" height="16.1983"/>
      <rect className="fill-loop el-2" x="64.236" y="81.9009" width="54.7445" height="16.1983"/>
      <rect className="fill-loop el-3" x="64.236" y="113.353" width="54.7445" height="16.1983"/>
      <path className="fill-loop el-4" d="M118.98 89.73V64.2177V50.7866L132.188 66.6474V81.709L125.685 89.73H118.98Z"/>
      <path className="fill-loop el-5" d="M118.98 89.6626V116.12V129.551L132.188 113.324V98.3337L125.632 89.6626H118.98Z"/>
      <rect className="fill-loop el-6" x="47.8125" y="66.6475" width="16.4234" height="15.2534"/>
      <rect className="fill-loop el-7" x="47.8125" y="98.0991" width="16.4234" height="15.2534"/>
    </svg>
  );
};

export default PathDrawingLogo;
