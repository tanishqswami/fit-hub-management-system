
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, Users, DollarSign, Trophy } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

const StatsCard = ({
  title,
  value,
  description,
  icon,
  className,
}: StatsCardProps) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const [topTrainer, setTopTrainer] = useState<any>(null);
  
  // Fetch members count
  const { data: membersCount = 0 } = useQuery({
    queryKey: ["membersCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true });
      
      if (error) {
        console.error("Error fetching members count:", error);
        return 0;
      }
      
      return count || 0;
    },
  });
  
  // Fetch trainers count
  const { data: trainersCount = 0 } = useQuery({
    queryKey: ["trainersCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("trainers")
        .select("*", { count: "exact", head: true });
      
      if (error) {
        console.error("Error fetching trainers count:", error);
        return 0;
      }
      
      return count || 0;
    },
  });
  
  // Fetch total revenue
  const { data: totalRevenue = 0 } = useQuery({
    queryKey: ["totalRevenue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("amount");
      
      if (error) {
        console.error("Error fetching payments:", error);
        return 0;
      }
      
      return data.reduce((total, payment) => total + parseFloat(payment.amount), 0);
    },
  });
  
  // Fetch top trainer
  useEffect(() => {
    const fetchTopTrainer = async () => {
      const { data, error } = await supabase
        .from("members")
        .select("trainer_id, trainers(user_id)")
        .not("trainer_id", "is", null);
      
      if (error) {
        console.error("Error fetching trainer data:", error);
        return;
      }
      
      // Count members per trainer
      const trainerCounts: Record<string, number> = {};
      data.forEach(member => {
        if (member.trainer_id) {
          trainerCounts[member.trainer_id] = (trainerCounts[member.trainer_id] || 0) + 1;
        }
      });
      
      // Find trainer with most members
      let topTrainerId = null;
      let maxCount = 0;
      Object.entries(trainerCounts).forEach(([trainerId, count]) => {
        if (count > maxCount) {
          topTrainerId = trainerId;
          maxCount = count;
        }
      });
      
      // If we have a top trainer, get their details
      if (topTrainerId) {
        const { data: trainerData, error: trainerError } = await supabase
          .from("trainers")
          .select("*, users(name)")
          .eq("id", topTrainerId)
          .single();
        
        if (trainerError) {
          console.error("Error fetching top trainer:", trainerError);
          return;
        }
        
        setTopTrainer({
          name: trainerData.users.name,
          memberCount: maxCount,
        });
      }
    };
    
    fetchTopTrainer();
  }, []);
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Members"
            value={membersCount.toString()}
            description="Active members in your gym"
            icon={<Users className="h-5 w-5 text-blue-500" />}
            className="border-l-4 border-blue-500"
          />
          <StatsCard
            title="Total Trainers"
            value={trainersCount.toString()}
            description="Professional trainers"
            icon={<Dumbbell className="h-5 w-5 text-green-500" />}
            className="border-l-4 border-green-500"
          />
          <StatsCard
            title="Total Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            description="Overall earnings"
            icon={<DollarSign className="h-5 w-5 text-yellow-500" />}
            className="border-l-4 border-yellow-500"
          />
          <StatsCard
            title="Top Trainer"
            value={topTrainer ? topTrainer.name : "N/A"}
            description={topTrainer ? `${topTrainer.memberCount} members` : "No data available"}
            icon={<Trophy className="h-5 w-5 text-purple-500" />}
            className="border-l-4 border-purple-500"
          />
        </div>
        
        <Tabs defaultValue="feedback" className="w-full">
          <TabsList>
            <TabsTrigger value="feedback">Recent Feedback</TabsTrigger>
            <TabsTrigger value="payments">Recent Payments</TabsTrigger>
            <TabsTrigger value="users">New Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="feedback" className="bg-white p-4 rounded-md shadow mt-2">
            <DashboardFeedbackTab />
          </TabsContent>
          
          <TabsContent value="payments" className="bg-white p-4 rounded-md shadow mt-2">
            <DashboardPaymentsTab />
          </TabsContent>
          
          <TabsContent value="users" className="bg-white p-4 rounded-md shadow mt-2">
            <DashboardUsersTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

// Feedback tab component
const DashboardFeedbackTab = () => {
  const { data: feedback = [] } = useQuery({
    queryKey: ["recentFeedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*, members(user_id, users(name))")
        .order("date", { ascending: false })
        .limit(5);
      
      if (error) {
        console.error("Error fetching recent feedback:", error);
        return [];
      }
      
      return data;
    },
  });
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Recent Feedback</h3>
      {feedback.length === 0 ? (
        <p className="text-muted-foreground">No feedback available yet.</p>
      ) : (
        <div className="space-y-4">
          {feedback.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between mb-2">
                  <div>
                    <p className="font-medium">
                      {item.members?.users?.name || "Unknown Member"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg font-bold mr-1">{item.rating}/5</span>
                    {/* Star icons based on rating */}
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < item.rating ? "text-yellow-500" : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm">{item.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Payments tab component
const DashboardPaymentsTab = () => {
  const { data: payments = [] } = useQuery({
    queryKey: ["recentPayments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, members(user_id, users(name))")
        .order("payment_date", { ascending: false })
        .limit(5);
      
      if (error) {
        console.error("Error fetching recent payments:", error);
        return [];
      }
      
      return data;
    },
  });
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Recent Payments</h3>
      {payments.length === 0 ? (
        <p className="text-muted-foreground">No payments recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment: any) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.members?.users?.name || "Unknown Member"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">${parseFloat(payment.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">{payment.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Users tab component
const DashboardUsersTab = () => {
  const { data: users = [] } = useQuery({
    queryKey: ["recentUsers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("id", { ascending: false })
        .limit(5);
      
      if (error) {
        console.error("Error fetching recent users:", error);
        return [];
      }
      
      return data;
    },
  });
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Recently Joined Users</h3>
      {users.length === 0 ? (
        <p className="text-muted-foreground">No users available yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user: any) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'trainer' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'}`}
                    >
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
