'use client';
import { useEffect, useState } from 'react';

const MESSAGES = [
  'Scanning project health…',
  'Checking audit trails…',
  'Analysing deviation patterns…',
  'Running compliance checks…',
  'Pulling team velocity…',
  'Loading quality data…',
  'Verifying GxP status…',
  'Building your dashboard…',
];

export default function Loading() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      {/* Animated logo mark */}
      <div className="relative w-16 h-16">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent"
          style={{
            borderTopColor: '#1565C0',
            borderRightColor: '#1565C020',
            animation: 'spin 1s linear infinite',
          }} />
        {/* Inner slower ring */}
        <div className="absolute inset-2 rounded-full border-4 border-transparent"
          style={{
            borderTopColor: '#1769C8',
            borderLeftColor: '#1769C820',
            animation: 'spin 1.5s linear infinite reverse',
          }} />
        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1256B0, #1769C8)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icon.png" alt="" width={14} height={14} style={{ objectFit: 'contain' }} />
          </div>
        </div>
      </div>

      {/* Pulsing message */}
      <div className="text-center space-y-1">
        <div
          key={msgIdx}
          className="text-sm font-medium text-slate-500"
          style={{ animation: 'fadeSlideIn 0.35s ease-out forwards' }}
        >
          {MESSAGES[msgIdx]}
        </div>
        {/* Dot trail */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-300"
              style={{ animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
