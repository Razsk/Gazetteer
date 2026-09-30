import React from 'react';

export interface ProgressClockProps {
  segments?: number;
  currentProgress?: number;
  size?: number;
  interactive?: boolean;
  onSegmentClick?: (segmentIndex: number) => void;
  className?: string;
}

export const ProgressClock: React.FC<ProgressClockProps> = ({
  segments = 4,
  currentProgress = 0,
  size = 64,
  interactive = false,
  onSegmentClick,
  className = '',
}) => {
  const segs = Math.max(2, Math.min(24, segments));
  const progress = Math.max(0, Math.min(segs, currentProgress));
  const isComplete = progress >= segs;

  const radius = 42;
  const center = 50;

  // Generate slice path
  const getSlicePath = (index: number) => {
    const anglePerSegment = 360 / segs;
    const startAngle = -90 + index * anglePerSegment;
    const endAngle = startAngle + anglePerSegment;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = anglePerSegment > 180 ? 1 : 0;

    return `M ${center} ${center} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="overflow-visible select-none"
      >
        {/* Background circle outline */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          className="fill-black/5 dark:fill-white/5 stroke-current/30"
          strokeWidth="2.5"
        />

        {/* Individual slices */}
        {Array.from({ length: segs }).map((_, idx) => {
          const isFilled = idx < progress;
          return (
            <path
              key={idx}
              d={getSlicePath(idx)}
              className={`transition-colors stroke-current/40 ${
                isFilled
                  ? isComplete
                    ? 'fill-red-500/90 dark:fill-red-500/90'
                    : 'fill-indigo-600 dark:fill-indigo-500'
                  : 'fill-transparent hover:fill-current/10'
              } ${interactive ? 'cursor-pointer hover:stroke-current' : ''}`}
              strokeWidth="1.5"
              onClick={(e) => {
                if (interactive && onSegmentClick) {
                  e.stopPropagation();
                  onSegmentClick(idx);
                }
              }}
            >
              <title>{`Segment ${idx + 1} of ${segs}: ${isFilled ? 'Filled' : 'Empty'}`}</title>
            </path>
          );
        })}

        {/* Center hub */}
        <circle
          cx={center}
          cy={center}
          r="4.5"
          className={isComplete ? 'fill-red-600' : 'fill-indigo-700 dark:fill-indigo-300'}
        />
      </svg>
    </div>
  );
};
