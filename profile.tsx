import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser, useUpdateProfile, useLogout } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { addToast } from "@/components/WinToast";
import { formatDistanceToNow } from "date-fns";
import { Referral } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ProfilePage() {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: userData } = useUser();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  
  const { data: referrals = [], isLoading: isLoadingReferrals } = useQuery<any[]>({
    queryKey: ["/api/referrals"],
  });
  
  const handleEditName = () => {
    setNewUsername(userData?.username || "");
    setIsEditingName(true);
  };
  
  const handleSaveName = () => {
    if (newUsername.trim() && newUsername !== userData?.username) {
      updateProfile.mutate({ username: newUsername });
    }
    setIsEditingName(false);
  };
  
  const handleProfilePicChange = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateProfile.mutate({ profilePic: base64String });
    };
    reader.readAsDataURL(file);
  };
  
  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${userData?.referralCode}`;
    navigator.clipboard.writeText(link);
    addToast("Link Copied", "Referral link copied to clipboard", "success");
  };
  
  const shareLink = (platform: string) => {
    const link = `${window.location.origin}?ref=${userData?.referralCode}`;
    const text = "Earn money by spinning! Join me on SpinCash and get 200 points as a welcome bonus!";
    
    let shareUrl = "";
    
    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + link)}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
        break;
      case "more":
        if (navigator.share) {
          navigator.share({
            title: "Join SpinCash",
            text,
            url: link,
          }).catch(console.error);
          return;
        }
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };
  
  const handleLogout = () => {
    logout.mutate();
  };
  
  return (
    <div className="p-4 h-full pb-20">
      {/* User Info Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="relative mr-4">
              <img 
                src={userData?.profilePic || "https://ui-avatars.com/api/?name=" + encodeURIComponent(userData?.username || "User")}
                alt="Profile" 
                className="w-20 h-20 rounded-full object-cover border-2 border-primary"
              />
              <button 
                onClick={handleProfilePicChange}
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 text-xs"
              >
                <i className="fas fa-camera"></i>
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-1">{userData?.username}</h2>
                  <p className="text-sm text-gray-500">{userData?.email}</p>
                </div>
                <button 
                  onClick={handleEditName}
                  className="text-primary hover:text-primary/80"
                >
                  <i className="fas fa-pencil-alt"></i>
                </button>
              </div>
              
              {isEditingName && (
                <div className="mt-3">
                  <div className="flex space-x-2">
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="flex-1"
                      placeholder="Enter new name"
                    />
                    <Button 
                      onClick={handleSaveName}
                      size="sm"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Referral Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Referrals</h3>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
              {referrals.length} Friends Joined
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Invite friends and earn 200 points for each friend who joins!
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center">
            <Input
              value={`${window.location.origin}?ref=${userData?.referralCode}`}
              readOnly
              className="flex-1 bg-transparent border-none"
            />
            <Button 
              onClick={copyReferralLink}
              className="ml-2"
              size="sm"
            >
              Copy
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={() => shareLink("whatsapp")}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <i className="fab fa-whatsapp mr-2"></i> WhatsApp
            </Button>
            <Button
              onClick={() => shareLink("telegram")}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              <i className="fab fa-telegram-plane mr-2"></i> Telegram
            </Button>
            <Button
              onClick={() => shareLink("more")}
              className="flex-1 bg-gray-800 hover:bg-gray-900"
            >
              <i className="fas fa-share-alt mr-2"></i> More
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Referred Friends */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Referred Friends</h3>
          
          {isLoadingReferrals ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-2 border-b border-gray-100 animate-pulse">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                    <div>
                      <div className="h-4 w-24 bg-gray-200 mb-1 rounded"></div>
                      <div className="h-3 w-20 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <i className="fas fa-users text-gray-400 text-xl"></i>
              </div>
              <p className="text-gray-500">No referrals yet</p>
              <p className="text-sm text-gray-400">Share your link to start earning!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral: any, index: number) => {
                const isLast = index === referrals.length - 1;
                return (
                  <div 
                    key={referral.id} 
                    className={`flex items-center justify-between p-2 ${!isLast ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mr-3">
                        <img 
                          src={referral.referredUser?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(referral.referredUser?.username || "User")}`}
                          alt="User" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{referral.referredUser?.username || "User"}</p>
                        <p className="text-xs text-gray-500">
                          Joined {formatDistanceToNow(new Date(referral.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <span className="text-amber-500 font-medium">+{referral.points} pts</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Logout Button */}
      <div className="mt-6 mb-10">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-red-500 text-red-500 hover:bg-red-50"
        >
          Log Out
        </Button>
      </div>
    </div>
  );
}

export default ProfilePage;
