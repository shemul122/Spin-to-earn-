import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { FiRefreshCw, FiDollarSign, FiUser } from "react-icons/fi";

const NAV_ITEMS = [
  { path: "/", icon: FiRefreshCw, label: "Spin" },
  { path: "/withdraw", icon: FiDollarSign, label: "Withdraw" },
  { path: "/profile", icon: FiUser, label: "Profile" },
];

type NavigationBarProps = {
  currentPath: string;
};

export function NavigationBar({ currentPath }: NavigationBarProps) {
  const [, setLocation] = useLocation();

  const handleNavClick = useCallback((path: string) => {
    setLocation(path);
  }, [setLocation]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-30">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path;
        
        return (
          <button 
            key={item.path}
            onClick={() => handleNavClick(item.path)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full",
              isActive 
                ? "text-primary bg-primary/5" 
                : "text-gray-500 hover:bg-gray-50"
            )}
          >
            <Icon className="mb-1" size={18} />
            <span className="text-xs">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default NavigationBar;
