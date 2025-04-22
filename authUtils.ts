import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./queryClient";
import { useToast } from "@/hooks/use-toast";

export function useUser() {
  return useQuery({
    queryKey: ["/api/auth/me"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLogin() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (userData?: { username: string, email: string }) => {
      if (!userData) {
        throw new Error("User data is required");
      }
      
      const response = await apiRequest("POST", "/api/auth/google", {
        googleId: `temp-${Date.now()}`,  // Create a temporary unique ID
        email: userData.email,
        username: userData.username,
        profilePic: null,
      });
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Failed to log in",
        variant: "destructive",
      });
    },
  });
}

export function useLogout() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "Failed to log out",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProfile() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ username, profilePic }: { username?: string, profilePic?: string }) => {
      const response = await apiRequest("PATCH", "/api/profile", { username, profilePic });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });
}
