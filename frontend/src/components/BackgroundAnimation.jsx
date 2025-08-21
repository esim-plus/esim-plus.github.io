import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const BackgroundAnimation = () => {
  const containerRef = useRef(null);
  const circlesRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create floating circles
    const circles = [];
    const numberOfCircles = 25;

    for (let i = 0; i < numberOfCircles; i++) {
      const circle = document.createElement('div');
      circle.className = 'floating-circle';
      
      // Random size between 20-100px
      const size = Math.random() * 80 + 20;
      circle.style.width = `${size}px`;
      circle.style.height = `${size}px`;
      
      // Random initial position
      circle.style.left = `${Math.random() * 100}%`;
      circle.style.top = `${Math.random() * 100}%`;
      
      // Random opacity
      circle.style.opacity = Math.random() * 0.3 + 0.1;
      
      container.appendChild(circle);
      circles.push(circle);
    }

    circlesRef.current = circles;

    // Animate circles with GSAP
    circles.forEach((circle, index) => {
      // Create timeline for each circle
      const tl = gsap.timeline({ repeat: -1, yoyo: true });
      
      // Random animation duration between 8-15 seconds
      const duration = Math.random() * 7 + 8;
      
      // Random movement range
      const xMovement = (Math.random() - 0.5) * 200;
      const yMovement = (Math.random() - 0.5) * 200;
      const rotation = Math.random() * 360;
      const scale = Math.random() * 0.5 + 0.75;
      
      tl.to(circle, {
        x: xMovement,
        y: yMovement,
        rotation: rotation,
        scale: scale,
        duration: duration,
        ease: "sine.inOut",
        delay: Math.random() * 2
      });
      
      // Add pulsing effect to some circles
      if (Math.random() > 0.7) {
        gsap.to(circle, {
          opacity: 0.4,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "power2.inOut",
          delay: Math.random() * 3
        });
      }
    });

    // Cleanup function
    return () => {
      circles.forEach(circle => {
        gsap.killTweensOf(circle);
        if (circle.parentNode) {
          circle.parentNode.removeChild(circle);
        }
      });
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="background-container"
    >
      <div className="gradient-bg" />
    </div>
  );
};

export default BackgroundAnimation;