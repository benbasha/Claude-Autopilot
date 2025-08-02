import React, { useEffect, useState } from 'react';
import './ProgressCircle.css';

const ProgressCircle = ({ progress = 0, animated = false, size = 120 }) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const circumference = 2 * Math.PI * (size / 2 - 10);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (currentProgress / 100) * circumference;

  useEffect(() => {
    if (animated) {
      // Animate to target progress
      let current = 0;
      const increment = progress / 100;
      const timer = setInterval(() => {
        current += increment;
        if (current >= progress) {
          setCurrentProgress(progress);
          clearInterval(timer);
        } else {
          setCurrentProgress(current);
        }
      }, 20);

      return () => clearInterval(timer);
    } else {
      setCurrentProgress(progress);
    }
  }, [progress, animated]);

  return (
    <div className="progress-circle" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="progress-ring">
        <circle
          className="progress-ring-bg"
          stroke="var(--border-color)"
          strokeWidth="8"
          fill="transparent"
          r={size / 2 - 10}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="progress-ring-progress"
          stroke="url(#progressGradient)"
          strokeWidth="8"
          fill="transparent"
          r={size / 2 - 10}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray,
            strokeDashoffset,
            transition: 'stroke-dashoffset 1s ease-in-out'
          }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary-cyan)" />
            <stop offset="100%" stopColor="var(--accent-purple)" />
          </linearGradient>
        </defs>
      </svg>
      <span className="progress-text">{Math.round(currentProgress)}%</span>
    </div>
  );
};

export default ProgressCircle;