import React, { useEffect, useRef } from 'react';

interface EdgeFlowParticlesProps {
  pathRef: React.RefObject<SVGPathElement | null>;
  particleCount?: number;
  speed?: number;
  color?: string;
  isActive?: boolean;
}

export const EdgeFlowParticles: React.FC<EdgeFlowParticlesProps> = ({
  pathRef,
  particleCount = 3,
  speed = 1, // lowered default speed from 2 to 1 pixel per frame
  color = '#00ffcc',
  isActive = true,
}) => {
  const groupRef = useRef<SVGGElement>(null);
  const animationRef = useRef<number | null>(null);
  const progressRef = useRef<number[]>(Array(particleCount).fill(0).map((_, i) => (i / particleCount)));

  useEffect(() => {
    if (!isActive || !pathRef.current || !groupRef.current) {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      return;
    }
    
    const path = pathRef.current;
    const particles = Array.from(groupRef.current.children) as SVGCircleElement[];

    const animate = () => {
      // Recalculate pathLength every frame so it responds dynamically when dragging nodes
      const pathLength = path.getTotalLength();
      
      if (pathLength > 0) {
        progressRef.current = progressRef.current.map((p, i) => {
          let newProgress = p + (speed / pathLength);
          if (newProgress > 1) newProgress %= 1; // Smoothly loop back to start without losing remainder
          
          try {
            const point = path.getPointAtLength(newProgress * pathLength);
            particles[i].setAttribute('cx', point.x.toString());
            particles[i].setAttribute('cy', point.y.toString());
          } catch (e) {
            // Fallback if path is invalid during rapid updates
          }
          
          return newProgress;
        });
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [pathRef, speed, isActive, particleCount]);

  if (!isActive) return null;

  return (
    <g ref={groupRef} style={{ pointerEvents: 'none' }}>
      {Array.from({ length: particleCount }).map((_, i) => (
        <circle key={i} r={3} fill={color} filter="drop-shadow(0 0 4px #00ffcc)" />
      ))}
    </g>
  );
};
