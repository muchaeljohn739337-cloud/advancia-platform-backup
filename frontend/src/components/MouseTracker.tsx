'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface ClickPoint {
  x: number;
  y: number;
  timestamp: number;
  id: string;
}

interface MouseTrackerProps {
  enabled?: boolean;
  showHeatmap?: boolean;
  showClickAnimation?: boolean;
  trackingArea?: 'fullscreen' | 'component';
}

export default function MouseTracker({
  enabled = true,
  showHeatmap = false,
  showClickAnimation = true,
  trackingArea = 'fullscreen',
}: MouseTrackerProps) {
  const [clicks, setClicks] = useState<ClickPoint[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTracking, setIsTracking] = useState(enabled);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track mouse position
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isTracking) return;

      const rect =
        trackingArea === 'component' && containerRef.current
          ? containerRef.current.getBoundingClientRect()
          : { left: 0, top: 0 };

      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [isTracking, trackingArea]
  );

  // Track clicks with animation
  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!isTracking || !showClickAnimation) return;

      const rect =
        trackingArea === 'component' && containerRef.current
          ? containerRef.current.getBoundingClientRect()
          : { left: 0, top: 0 };

      const newClick: ClickPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        timestamp: Date.now(),
        id: `click-${Date.now()}-${Math.random()}`,
      };

      setClicks((prev) => [...prev, newClick]);

      // Remove click animation after 1 second
      setTimeout(() => {
        setClicks((prev) => prev.filter((c) => c.id !== newClick.id));
      }, 1000);
    },
    [isTracking, showClickAnimation, trackingArea]
  );

  // Setup event listeners
  useEffect(() => {
    if (!isTracking) return;

    const target =
      trackingArea === 'component' && containerRef.current ? containerRef.current : window;

    target.addEventListener('mousemove', handleMouseMove as any);
    target.addEventListener('click', handleClick as any);

    return () => {
      target.removeEventListener('mousemove', handleMouseMove as any);
      target.removeEventListener('click', handleClick as any);
    };
  }, [isTracking, handleMouseMove, handleClick, trackingArea]);

  if (!isTracking) return null;

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none fixed inset-0 z-50 ${
        trackingArea === 'component' ? 'relative' : ''
      }`}
      style={{ mixBlendMode: 'difference' }}
    >
      {/* Mouse position indicator */}
      <div
        className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-blue-500 bg-blue-500/20 transition-all duration-75"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      />

      {/* Click animations */}
      {showClickAnimation &&
        clicks.map((click) => (
          <div
            key={click.id}
            className="absolute animate-ping"
            style={{
              left: `${click.x}px`,
              top: `${click.y}px`,
            }}
          >
            <div className="w-8 h-8 -ml-4 -mt-4 rounded-full bg-green-500/50 border-2 border-green-500" />
          </div>
        ))}

      {/* Heatmap visualization (simplified) */}
      {showHeatmap && clicks.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {clicks.slice(-20).map((click) => (
            <div
              key={click.id}
              className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full bg-gradient-radial from-red-500/30 to-transparent"
              style={{
                left: `${click.x}px`,
                top: `${click.y}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Control panel */}
      <div className="absolute top-4 right-4 bg-gray-900/90 text-white p-4 rounded-lg shadow-lg pointer-events-auto backdrop-blur-sm">
        <div className="text-sm font-mono space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Mouse Tracking:</span>
            <button
              onClick={() => setIsTracking(!isTracking)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                isTracking ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isTracking ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="border-t border-gray-700 pt-2">
            <div className="text-xs text-gray-400">Position:</div>
            <div className="text-green-400">
              X: {Math.round(mousePosition.x)} Y: {Math.round(mousePosition.y)}
            </div>
          </div>
          <div className="border-t border-gray-700 pt-2">
            <div className="text-xs text-gray-400">Clicks Tracked:</div>
            <div className="text-blue-400">{clicks.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
