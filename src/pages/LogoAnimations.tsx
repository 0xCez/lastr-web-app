import { useState } from "react";
import { PathDrawingLogo, LogoSpinner } from "@/components/ui/AnimatedLogo";

const LogoAnimations = () => {
  const [replay, setReplay] = useState(0);

  const handleReplay = () => {
    setReplay((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center px-8 py-16">
      {/* INTRO ANIMATION - The original with the box */}
      <h1 className="text-3xl font-bold text-white mb-2">Intro Animation</h1>
      <p className="text-gray-400 mb-8">Path drawing effect for splash screens</p>

      <div className="bg-gray-800/50 rounded-2xl p-12 backdrop-blur-sm border border-gray-700 mb-6">
        <PathDrawingLogo key={`path-${replay}`} size={200} />
      </div>

      <button
        onClick={handleReplay}
        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition-all mb-20"
      >
        Replay Animation
      </button>

      {/* DRAWING STYLE SPINNER */}
      <h2 className="text-2xl font-bold text-white mb-2">Drawing Spinner</h2>
      <p className="text-gray-400 mb-8">Looping version with the same drawing style</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-20">
        <div className="flex flex-col items-center">
          <div className="bg-gray-800/30 rounded-xl p-10 border border-gray-700/50 mb-4">
            <LogoSpinner size={100} />
          </div>
          <p className="text-gray-500 text-xs">Default (cyan)</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-gray-800/30 rounded-xl p-10 border border-gray-700/50 mb-4">
            <LogoSpinner size={100} color="#E8F1F7" />
          </div>
          <p className="text-gray-500 text-xs">White variant</p>
        </div>
      </div>

      {/* Spinner sizes */}
      <h3 className="text-lg font-semibold text-white mb-6">Spinner Sizes</h3>
      <div className="flex items-end gap-10 mb-20">
        {[32, 48, 64, 80].map((s) => (
          <div key={s} className="flex flex-col items-center">
            <LogoSpinner size={s} />
            <span className="text-gray-500 text-xs mt-3">{s}px</span>
          </div>
        ))}
      </div>

      {/* SIMPLE LOADERS SECTION */}
      <h2 className="text-2xl font-bold text-white mb-2">Simple Loaders</h2>
      <p className="text-gray-400 mb-10">Alternative loader styles</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
        {/* Variant 1: Wave Sweep */}
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold text-white mb-2">Wave Sweep</h3>
          <p className="text-gray-500 text-xs mb-6">Sequential light-up</p>
          <div className="bg-gray-800/30 rounded-xl p-8 border border-gray-700/50">
            <LogoLoaderWave size={80} />
          </div>
        </div>

        {/* Variant 2: Pulse */}
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold text-white mb-2">Pulse</h3>
          <p className="text-gray-500 text-xs mb-6">Breathing effect</p>
          <div className="bg-gray-800/30 rounded-xl p-8 border border-gray-700/50">
            <LogoLoaderPulse size={80} />
          </div>
        </div>

        {/* Variant 3: Spin Glow */}
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold text-white mb-2">Spin Glow</h3>
          <p className="text-gray-500 text-xs mb-6">Rotating highlight</p>
          <div className="bg-gray-800/30 rounded-xl p-8 border border-gray-700/50">
            <LogoLoaderSpin size={80} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Variant 1: Wave Sweep - Sequential light-up effect
export const LogoLoaderWave = ({ size = 48, color = "#00C8FF" }: { size?: number; color?: string }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="40 45 100 95"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="logo-loader-wave"
    >
      <style>{`
        .logo-loader-wave .element {
          fill: ${color};
          opacity: 0.25;
          animation: waveLight 1.4s ease-in-out infinite;
        }
        .logo-loader-wave .el-1 { animation-delay: 0s; }
        .logo-loader-wave .el-2 { animation-delay: 0.1s; }
        .logo-loader-wave .el-3 { animation-delay: 0.2s; }
        .logo-loader-wave .el-4 { animation-delay: 0.3s; }
        .logo-loader-wave .el-5 { animation-delay: 0.4s; }
        .logo-loader-wave .el-6 { animation-delay: 0.5s; }
        .logo-loader-wave .el-7 { animation-delay: 0.6s; }

        @keyframes waveLight {
          0%, 100% { opacity: 0.25; }
          35% { opacity: 1; }
          70% { opacity: 0.25; }
        }
      `}</style>

      {/* Horizontal bars */}
      <rect className="element el-1" x="64.236" y="50.4492" width="54.7445" height="16.1983"/>
      <rect className="element el-2" x="64.236" y="81.9009" width="54.7445" height="16.1983"/>
      <rect className="element el-3" x="64.236" y="113.353" width="54.7445" height="16.1983"/>

      {/* Arrow parts */}
      <path className="element el-4" d="M118.98 89.73V64.2177V50.7866L132.188 66.6474V81.709L125.685 89.73H118.98Z"/>
      <path className="element el-5" d="M118.98 89.6626V116.12V129.551L132.188 113.324V98.3337L125.632 89.6626H118.98Z"/>

      {/* Left dots */}
      <rect className="element el-6" x="47.8125" y="66.6475" width="16.4234" height="15.2534"/>
      <rect className="element el-7" x="47.8125" y="98.0991" width="16.4234" height="15.2534"/>
    </svg>
  );
};

// Variant 2: Pulse - Breathing effect with scale
export const LogoLoaderPulse = ({ size = 48, color = "#00C8FF" }: { size?: number; color?: string }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="40 45 100 95"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="logo-loader-pulse"
    >
      <style>{`
        .logo-loader-pulse {
          animation: pulseScale 1.5s ease-in-out infinite;
        }
        .logo-loader-pulse .element {
          fill: ${color};
          animation: pulseOpacity 1.5s ease-in-out infinite;
        }

        @keyframes pulseScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        @keyframes pulseOpacity {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Horizontal bars */}
      <rect className="element" x="64.236" y="50.4492" width="54.7445" height="16.1983"/>
      <rect className="element" x="64.236" y="81.9009" width="54.7445" height="16.1983"/>
      <rect className="element" x="64.236" y="113.353" width="54.7445" height="16.1983"/>

      {/* Arrow parts */}
      <path className="element" d="M118.98 89.73V64.2177V50.7866L132.188 66.6474V81.709L125.685 89.73H118.98Z"/>
      <path className="element" d="M118.98 89.6626V116.12V129.551L132.188 113.324V98.3337L125.632 89.6626H118.98Z"/>

      {/* Left dots */}
      <rect className="element" x="47.8125" y="66.6475" width="16.4234" height="15.2534"/>
      <rect className="element" x="47.8125" y="98.0991" width="16.4234" height="15.2534"/>
    </svg>
  );
};

// Variant 3: Spin Glow - Rotating highlight around the icon
export const LogoLoaderSpin = ({ size = 48, color = "#00C8FF" }: { size?: number; color?: string }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="40 45 100 95"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="logo-loader-spin"
    >
      <style>{`
        .logo-loader-spin .base {
          fill: ${color};
          opacity: 0.3;
        }
        .logo-loader-spin .highlight {
          fill: ${color};
          opacity: 0;
          animation: spinHighlight 1.2s linear infinite;
        }
        .logo-loader-spin .hl-1 { animation-delay: 0s; }
        .logo-loader-spin .hl-2 { animation-delay: 0.17s; }
        .logo-loader-spin .hl-3 { animation-delay: 0.34s; }
        .logo-loader-spin .hl-4 { animation-delay: 0.51s; }
        .logo-loader-spin .hl-5 { animation-delay: 0.68s; }
        .logo-loader-spin .hl-6 { animation-delay: 0.85s; }
        .logo-loader-spin .hl-7 { animation-delay: 1.02s; }

        @keyframes spinHighlight {
          0% { opacity: 0; }
          15% { opacity: 1; }
          30% { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* Base layer (dim) */}
      <rect className="base" x="64.236" y="50.4492" width="54.7445" height="16.1983"/>
      <rect className="base" x="64.236" y="81.9009" width="54.7445" height="16.1983"/>
      <rect className="base" x="64.236" y="113.353" width="54.7445" height="16.1983"/>
      <path className="base" d="M118.98 89.73V64.2177V50.7866L132.188 66.6474V81.709L125.685 89.73H118.98Z"/>
      <path className="base" d="M118.98 89.6626V116.12V129.551L132.188 113.324V98.3337L125.632 89.6626H118.98Z"/>
      <rect className="base" x="47.8125" y="66.6475" width="16.4234" height="15.2534"/>
      <rect className="base" x="47.8125" y="98.0991" width="16.4234" height="15.2534"/>

      {/* Highlight layer (animated) */}
      <rect className="highlight hl-6" x="47.8125" y="66.6475" width="16.4234" height="15.2534"/>
      <rect className="highlight hl-1" x="64.236" y="50.4492" width="54.7445" height="16.1983"/>
      <path className="highlight hl-2" d="M118.98 89.73V64.2177V50.7866L132.188 66.6474V81.709L125.685 89.73H118.98Z"/>
      <rect className="highlight hl-3" x="64.236" y="81.9009" width="54.7445" height="16.1983"/>
      <path className="highlight hl-4" d="M118.98 89.6626V116.12V129.551L132.188 113.324V98.3337L125.632 89.6626H118.98Z"/>
      <rect className="highlight hl-5" x="64.236" y="113.353" width="54.7445" height="16.1983"/>
      <rect className="highlight hl-7" x="47.8125" y="98.0991" width="16.4234" height="15.2534"/>
    </svg>
  );
};

// Keep original for backwards compatibility
export const LogoLoader = LogoLoaderWave;

export default LogoAnimations;
