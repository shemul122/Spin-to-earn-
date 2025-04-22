import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { addToast } from "@/components/WinToast";
import SpinWheel from "@/components/ui/wheel";
import SpinCounter from "@/components/SpinCounter";
import PointsDisplay from "@/components/PointsDisplay";
import AdModal from "@/components/AdModal";

export function SpinPage() {
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [showLastWin, setShowLastWin] = useState(false);
  const [showAd, setShowAd] = useState(false);
  
  // Define proper user type with default values
  interface UserData {
    id: number;
    username: string;
    email: string;
    profilePic: string | null;
    points: number;
    referralCode: string;
  }
  
  // Use an explicit default value to avoid undefined errors
  const { data: userData = { 
    id: 0, 
    username: "", 
    email: "", 
    profilePic: null, 
    points: 0, 
    referralCode: "" 
  } } = useQuery<UserData>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  
  const spinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/spins");
      return response.json();
    },
    onSuccess: (data) => {
      setLastWin(data.spin.amount);
      setShowLastWin(true);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/spins/count"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spins/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Show ad after spin
      setTimeout(() => {
        setShowAd(true);
      }, 1500);
    },
    onError: (error) => {
      addToast("Spin failed", error.message || "Failed to spin the wheel", "error");
      setSpinning(false);
    },
  });
  
  // Hide last win after a delay
  useEffect(() => {
    if (showLastWin) {
      const timer = setTimeout(() => {
        setShowLastWin(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showLastWin]);
  
  const handleSpinEnd = (value: number) => {
    // The actual value is determined by the server for security
    spinMutation.mutate();
  };
  
  const closeAdModal = () => {
    setShowAd(false);
  };
  
  const wheelSegments = [
    { value: 5, color: "#4F46E5" },   // primary
    { value: 15, color: "#10B981" },  // secondary
    { value: 8, color: "#F59E0B" },   // accent
    { value: 25, color: "#EC4899" },  // pink
    { value: 10, color: "#4F46E5" },  // primary
    { value: 40, color: "#F59E0B" },  // accent
    { value: 12, color: "#10B981" },  // secondary
    { value: 20, color: "#EC4899" }   // pink
  ];
  
  // Get the spin count data with proper typing and defaults
  const { data: spinCountData = { count: 0, remaining: 10 } } = useQuery<{ count: number; remaining: number }>({
    queryKey: ["/api/spins/count"],
  });

  // Recent spins data with proper typing
  interface SpinData {
    id: number;
    userId: number;
    amount: number;
    createdAt: string;
  }
  
  const { data: recentSpins = [] } = useQuery<SpinData[]>({
    queryKey: ["/api/spins/recent"],
  });

  return (
    <div className="p-4 h-full bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-md mx-auto">
        {/* Header with points and spins count */}
        <div className="flex justify-between items-center mb-6">
          <SpinCounter totalPoints={userData?.points || 0} />
          <div className="text-right">
            <p className="text-sm text-gray-500">Spins Left Today</p>
            <p className="text-2xl font-bold text-indigo-600">{spinCountData?.remaining || 0}/10</p>
          </div>
        </div>
        
        {/* Main wheel section */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative mb-6 shadow-2xl rounded-full">
            <SpinWheel 
              segments={wheelSegments}
              onSpinEnd={handleSpinEnd}
              spinning={spinning}
              setSpinning={setSpinning}
            />
          </div>
          
          {/* Win notification with animation */}
          {showLastWin && lastWin !== null && (
            <div 
              className="text-center mb-6 transition-all duration-500 animate-bounce bg-white p-4 rounded-xl shadow-lg"
            >
              <p className="text-gray-600 mb-1">You've won</p>
              <p className="text-4xl font-bold text-amber-500">+{lastWin}</p>
              <p className="text-sm text-gray-500">points added to your balance</p>
            </div>
          )}
          
          {/* Points display */}
          <PointsDisplay />
        </div>
        
        {/* Recent spins history */}
        {recentSpins && recentSpins.length > 0 && (
          <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-medium mb-3">Recent Spins</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentSpins.map((spin, index) => (
                <div key={spin.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                  <div className="text-sm text-gray-600">
                    {new Date(spin.createdAt).toLocaleDateString()}
                  </div>
                  <div className="font-semibold text-green-600">+{spin.amount} points</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <AdModal isOpen={showAd} onClose={closeAdModal} />
    </div>
  );
}

export default SpinPage;
