import { useState, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

type AdModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AdModal = memo(function AdModal({ isOpen, onClose }: AdModalProps) {
  const [countdown, setCountdown] = useState(3); // Reduced countdown time
  const [canSkip, setCanSkip] = useState(false);
  
  useEffect(() => {
    if (!isOpen) return;
    
    // Reset countdown when modal opens
    setCountdown(3);
    setCanSkip(false);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        const newCount = prev - 1;
        if (newCount <= 0) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return newCount;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={cn(
        "bg-white rounded-lg shadow-lg w-full max-w-sm mx-4 transform transition-all duration-300",
        isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
      )}>
        <div className="p-3 flex justify-between items-center border-b">
          <h3 className="font-medium">Quick Ad</h3>
          {canSkip ? (
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={18} />
            </button>
          ) : (
            <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
              {countdown}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-md w-full h-32 mb-3 flex items-center justify-center overflow-hidden">
            <p className="text-center text-sm text-gray-500">Ad Content</p>
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 mb-1">Thank you for watching our ad!</p>
            <p className="text-xs text-gray-500">You can earn more points by watching ads.</p>
            
            <Button 
              onClick={onClose}
              disabled={!canSkip}
              variant="outline"
              className="w-full mt-2"
            >
              {canSkip ? "Close" : `Wait ${countdown}s...`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdModal;
