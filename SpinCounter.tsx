import { Progress } from "@/components/ui/progress";
import { FiGift } from "react-icons/fi";

type SpinCounterProps = {
  totalPoints: number;
};

export function SpinCounter({ totalPoints }: SpinCounterProps) {  
  return (
    <div className="flex items-center">
      <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-md">
        <FiGift className="text-white" />
        <span className="font-semibold">{totalPoints.toLocaleString()}</span>
      </div>
    </div>
  );
}

export default SpinCounter;
