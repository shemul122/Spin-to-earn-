import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useUser } from "@/lib/authUtils";
import { addToast } from "@/components/WinToast";
import { formatDistanceToNow } from "date-fns";
import { Withdrawal } from "@shared/schema";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  amount: z.coerce.number().min(1000, {
    message: "Minimum withdrawal amount is 1000 points",
  }),
  binanceUid: z.string().min(5, {
    message: "Please enter a valid Binance UID",
  }),
});

export function WithdrawPage() {
  const { data: userData } = useUser();
  const { data: withdrawals = [], isLoading: isLoadingWithdrawals } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals"],
  });
  
  const [usdValue, setUsdValue] = useState("0.10");
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 1000,
      binanceUid: "",
    },
  });
  
  const withdrawMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/withdrawals", values);
      return response.json();
    },
    onSuccess: () => {
      addToast("Withdrawal Requested", "Your request will be processed within 24 hours", "success");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error) => {
      addToast("Withdrawal Failed", error.message || "Failed to process withdrawal", "error");
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (values.amount > (userData?.points || 0)) {
      addToast("Insufficient Points", "You don't have enough points", "error");
      return;
    }
    
    withdrawMutation.mutate(values);
  };
  
  const calculateUsdValue = (points: number) => {
    const usd = (points / 1000 * 0.1).toFixed(2);
    setUsdValue(usd);
    return usd;
  };
  
  return (
    <div className="p-4 h-full pb-20">
      <Card className="mb-6">
        <CardContent className="p-6">
          <p className="text-sm text-gray-500 mb-1">Available Balance</p>
          <p className="text-3xl font-bold text-primary mb-4">{userData?.points || 0}</p>
          <p className="text-xs text-gray-500">1000 points = 0.1 USD</p>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (Points)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1000"
                        step="100"
                        placeholder="Minimum 1000 points"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          calculateUsdValue(Number(e.target.value));
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">
                      You will receive approximately <span className="font-medium">{usdValue}</span> USD
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="binanceUid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Binance UID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your Binance UID"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">
                      Make sure you enter the correct Binance UID
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={withdrawMutation.isPending}
              >
                {withdrawMutation.isPending ? "Processing..." : "Request Withdrawal"}
              </Button>
              
              <p className="text-xs text-center text-gray-500 mt-3">
                Withdrawal requests are processed within 24 hours
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Withdrawal History</h3>
          
          {isLoadingWithdrawals ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3 animate-pulse">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 w-24 bg-gray-100 rounded"></div>
                    <div className="h-3 w-20 bg-gray-100 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div id="empty-withdrawal-history" className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <i className="fas fa-receipt text-gray-400 text-xl"></i>
              </div>
              <p className="text-gray-500">No withdrawal history yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">
                      {withdrawal.amount} points ({(withdrawal.amount / 1000 * 0.1).toFixed(2)} USD)
                    </span>
                    <Badge
                      className={
                        withdrawal.status === "pending" 
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" 
                          : "bg-green-100 text-green-800 hover:bg-green-100"
                      }
                    >
                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Binance: ****{withdrawal.binanceUid.slice(-4)}</span>
                    <span>{formatDistanceToNow(new Date(withdrawal.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default WithdrawPage;
