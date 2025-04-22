import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FiCheck, FiAlertTriangle, FiInfo } from "react-icons/fi";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  title: string;
  message: string;
  type: ToastType;
};

// Simple global approach
let toastCounter = 0;
let listeners: ((toast: Toast) => void)[] = [];

export function addToast(title: string, message: string, type: ToastType = "success") {
  const id = `toast-${toastCounter++}`;
  const toast = { id, title, message, type };
  
  listeners.forEach(listener => listener(toast));
  
  return id;
}

export function WinToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  useEffect(() => {
    const handleNewToast = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 3000);
    };
    
    listeners.push(handleNewToast);
    
    return () => {
      listeners = listeners.filter(l => l !== handleNewToast);
    };
  }, []);
  
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed bottom-20 left-0 right-0 flex flex-col items-center z-40 space-y-2">
      {toasts.map(toast => {
        // Choose icon based on toast type
        const Icon = toast.type === 'success' ? FiCheck :
                    toast.type === 'error' ? FiAlertTriangle : 
                    FiInfo;
                  
        return (
          <div
            key={toast.id}
            className="bg-white shadow-md rounded-lg p-3 w-5/6 max-w-xs flex items-center transition-all duration-300"
          >
            <div 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center mr-3",
                toast.type === "success" && "bg-green-100 text-green-500",
                toast.type === "error" && "bg-red-100 text-red-500",
                toast.type === "info" && "bg-blue-100 text-blue-500"
              )}
            >
              <Icon size={16} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{toast.title}</p>
              <p className="text-xs text-gray-600">{toast.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default WinToast;
