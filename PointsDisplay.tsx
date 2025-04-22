import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { FaCoins } from "react-icons/fa";

interface UserData {
  points: number;
}

export function PointsDisplay() {
  // Use a direct query with default values to avoid undefined errors
  const { data: userData = { points: 0 } } = useQuery<UserData>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  
  return (
    <Button 
      variant="outline" 
      className="w-full flex justify-center items-center gap-2 py-6 bg-white hover:bg-amber-50 border-amber-200"
      disabled
    >
      <FaCoins className="text-amber-500" />
      <span className="font-medium">Spin to win up to 40 points!</span>
    </Button>
  );
}

export default PointsDisplay;
