'use client';

import { useEffect, useRef } from 'react';
import '../styles/paradise-animation.css';

export default function ParadiseAnimation({ text = 'PARADISE', backgroundColor = '#000000' }) {
  const containerRef = useRef(null);
  const letters = text.toUpperCase().split('').filter(char => char !== ' ');
  const originalText = text.toUpperCase();

  const playAnimation = () => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous animation
    const existingLetters = container.querySelectorAll('.paradise-letter, .paradise-spacer');
    existingLetters.forEach(el => el.remove());

    // Determine spark distance based on screen size
    const isSmallMobile = window.innerWidth < 360;
    const isMobile = window.innerWidth < 480;
    const isTablet = window.innerWidth < 640;
    const isLargeTablet = window.innerWidth < 1024;
    let sparkDistance = 80;
    if (isSmallMobile) sparkDistance = 25;
    else if (isMobile) sparkDistance = 35;
    else if (isTablet) sparkDistance = 45;
    else if (isLargeTablet) sparkDistance = 65;

    // Create letters with animation, preserving space positions
    let letterIndex = 0;
    for (let i = 0; i < originalText.length; i++) {
      const char = originalText[i];

      if (char === ' ') {
        // Create a spacer for spaces
        const spacer = document.createElement('span');
        spacer.className = 'paradise-spacer';
        container.appendChild(spacer);
      } else {
        const letterEl = document.createElement('span');
        letterEl.className = 'paradise-letter';
        letterEl.textContent = char;
        letterEl.style.animationDelay = `${letterIndex * 0.15}s`;
        container.appendChild(letterEl);

        // Create sparks for each letter
        for (let j = 0; j < 8; j++) {
          const spark = document.createElement('span');
          spark.className = 'paradise-spark';
          const sparkDelay = letterIndex * 0.15 + j * 0.05;
          spark.style.animationDelay = `${sparkDelay}s`;

          // Calculate angle in radians
          const angle = (360 / 8) * j * (Math.PI / 180);
          const x = Math.cos(angle) * sparkDistance;
          const y = Math.sin(angle) * sparkDistance;

          spark.style.setProperty('--spark-x', `${x}px`);
          spark.style.setProperty('--spark-y', `${y}px`);
          letterEl.appendChild(spark);
        }

        letterIndex++;
      }
    }
  };

  useEffect(() => {
    // Play animation on initial mount
    playAnimation();

    // Set up Intersection Observer to replay animation when scrolling back into view
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Play animation when element comes into view
          playAnimation();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);

    // Handle window resize to adjust spark distance on screen size change
    const handleResize = () => {
      playAnimation();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      observer.unobserve(container);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [letters]);

  return (
    <div
      className="paradise-container"
      ref={containerRef}
      style={{ backgroundColor: backgroundColor }}
    >
      {/* Letters will be added dynamically */}
    </div>
  );
}
