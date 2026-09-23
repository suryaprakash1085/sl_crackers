'use client';

import React, { useState } from 'react';
import './FireworksBurst.css';

export default function FireworksBurst({ x = 0, y = 0, onAnimationEnd }) {
  const [isVisible, setIsVisible] = useState(true);

  const handleAnimationEnd = () => {
    setIsVisible(false);
    onAnimationEnd?.();
  };

  if (!isVisible) return null;

  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    angle: (i * 360) / 24,
  }));

  return (
    <div
      className="firework-burst"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="firework-particle"
          style={{
            '--angle': particle.angle,
          }}
        />
      ))}
    </div>
  );
}
