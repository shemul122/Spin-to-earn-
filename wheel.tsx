import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type WheelSegment = {
  value: number;
  color: string;
};

type SpinWheelProps = {
  segments: WheelSegment[];
  onSpinEnd: (value: number) => void;
  spinning: boolean;
  setSpinning: (spinning: boolean) => void;
};

export function SpinWheel({
  segments,
  onSpinEnd,
  spinning,
  setSpinning,
}: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [winValue, setWinValue] = useState<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spinWheel = () => {
    if (spinning) return;
    
    setSpinning(true);
    
    // Random rotation (3-10 full rotations plus a random segment)
    const rotations = 3 + Math.floor(Math.random() * 7);
    const extraDegrees = Math.floor(Math.random() * segments.length) * (360 / segments.length);
    const totalDegrees = rotations * 360 + extraDegrees;
    
    // Calculate which segment will be the winner
    const segmentSize = 360 / segments.length;
    const winningSegmentIndex = Math.floor(extraDegrees / segmentSize);
    const value = segments[winningSegmentIndex].value;
    
    setRotation(prev => prev + totalDegrees);
    setWinValue(value);
  };

  useEffect(() => {
    if (!spinning || winValue === null) return;
    
    const timer = setTimeout(() => {
      setSpinning(false);
      onSpinEnd(winValue);
      setWinValue(null);
    }, 4200); // Match this to CSS transition time
    
    return () => clearTimeout(timer);
  }, [spinning, winValue, onSpinEnd, setSpinning]);

  return (
    <div className="relative">
      <div
        ref={wheelRef}
        className="spin-wheel relative w-72 h-72 rounded-full overflow-hidden mx-auto transition-transform duration-4000 ease-out"
        style={{
          transform: `rotate(${rotation}deg)`,
          transitionDuration: "4s",
        }}
      >
        {segments.map((segment, i) => {
          const angle = 360 / segments.length;
          return (
            <div
              key={i}
              className="absolute w-full h-full origin-center"
              style={{
                transform: `rotate(${i * angle}deg)`,
                clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((angle * Math.PI) / 180)}% ${
                  50 - 50 * Math.sin((angle * Math.PI) / 180)
                }%)`,
                backgroundColor: segment.color,
              }}
            >
              <div 
                className="absolute text-white font-bold text-sm origin-center"
                style={{
                  transform: `rotate(${angle / 2}deg) translateY(-120px)`,
                  width: "100%",
                  textAlign: "center",
                }}
              >
                {segment.value}
              </div>
            </div>
          );
        })}
      </div>
      
      <button
        onClick={spinWheel}
        disabled={spinning}
        className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
          "bg-white text-primary font-bold rounded-full w-20 h-20",
          "flex items-center justify-center shadow-lg border-4 border-primary",
          "transition-all duration-300",
          spinning && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="text-lg">SPIN</span>
      </button>
    </div>
  );
}

export default SpinWheel;
