
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  Dumbbell, 
  Info,
  ChevronRight, 
  Check, 
  X 
} from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
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

const TrainerDashboard = () => {
  const { userData } = useAuth();
  const [trainerId, setTrainerId] = useState<string | null>(null);

  // First, get trainer ID from user ID
  useEffect(() => {
    const fetchTrainerId = async () => {
      if (!userData?.id) return;

      try {
        const { data, error } = await supabase
          .from("trainers")
          .select("id")
          .eq("user_id", userData.id)
          .single();

        if (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch trainer information",
          });
          return;
        }

        if (data) {
          setTrainerId(data.id);
        }
      } catch (error) {
        console.error("Error fetching trainer ID:", error);
      }
    };

    fetchTrainerId();
  }, [userData]);

  // Fetch assigned members count
  const { data: membersCount = 0 } = useQuery({
    queryKey: ["assignedMembersCount", trainerId],
    queryFn: async () => {
      if (!trainerId) return 0;
      
      const { count, error } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("trainer_id", trainerId);
      
      if (error) {
        console.error("Error fetching members count:", error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!trainerId,
  });

  // Fetch workout plans count
  const { data: workoutPlansCount = 0 } = useQuery({
    queryKey: ["workoutPlansCount", trainerId],
    queryFn: async () => {
      if (!trainerId) return 0;
      
      const { count, error } = await supabase
        .from("workout_plans")
        .select("*", { count: "exact", head: true })
        .eq("created_by", trainerId);
      
      if (error) {
        console.error("Error fetching workout plans count:", error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!trainerId,
  });

  // Fetch attendance data for today
  const { data: attendanceToday = 0 } = useQuery({
    queryKey: ["attendanceToday", trainerId],
    queryFn: async () => {
      if (!trainerId) return 0;
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("attendance")
        .select("id")
        .eq("date", today)
        .in("status", ["present"])
        .eq("member_id", trainerId); // This is a simplification
      
      if (error) {
        console.error("Error fetching attendance:", error);
        return 0;
      }
      
      return data.length;
    },
    enabled: !!trainerId,
  });

  // Fetch recent members
  const { data: recentMembers = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ["recentMembers", trainerId],
    queryFn: async () => {
      if (!trainerId) return [];
      
      const { data, error } = await supabase
        .from("members")
        .select(`
          id,
          users:user_id (id, name, email),
          join_date
        `)
        .eq("trainer_id", trainerId)
        .order("join_date", { ascending: false })
        .limit(5);
      
      if (error) {
        console.error("Error fetching recent members:", error);
        return [];
      }
      
      return data;
    },
    enabled: !!trainerId,
  });

  // Fetch upcoming attendance
  const { data: todaysAttendance = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["todaysAttendance", trainerId],
    queryFn: async () => {
      if (!trainerId) return [];
      
      const today = new Date().toISOString().split('T')[0];
      
      // Get members assigned to this trainer
      const { data: members, error: membersError } = await supabase
        .from("members")
        .select(`
          id,
          users:user_id (id, name)
        `)
        .eq("trainer_id", trainerId);
      
      if (membersError) {
        console.error("Error fetching members:", membersError);
        return [];
      }
      
      if (!members || members.length === 0) {
        return [];
      }
      
      // Get attendance records for today for these members
      const memberIds = members.map(m => m.id);
      const { data: attendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", today)
        .in("member_id", memberIds);
      
      if (attendanceError) {
        console.error("Error fetching attendance:", attendanceError);
        return [];
      }
      
      // Combine member info with attendance status
      const result = members.map(member => {
        const attendanceRecord = attendance?.find(a => a.member_id === member.id);
        return {
          id: member.id,
          name: member.users?.name || "Unknown",
          status: attendanceRecord?.status || "not_marked",
        };
      });
      
      return result;
    },
    enabled: !!trainerId,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Trainer Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Assigned Members"
            value={membersCount}
            description="Members under your guidance"
            icon={<Users className="h-5 w-5 text-blue-500" />}
            className="border-l-4 border-blue-500"
          />
          <StatsCard
            title="Workout Plans"
            value={workoutPlansCount}
            description="Plans you've created"
            icon={<Dumbbell className="h-5 w-5 text-green-500" />}
            className="border-l-4 border-green-500"
          />
          <StatsCard
            title="Today's Attendance"
            value={attendanceToday}
            description="Members checked in today"
            icon={<Calendar className="h-5 w-5 text-purple-500" />}
            className="border-l-4 border-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Members */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Members</CardTitle>
                <CardDescription>Latest members assigned to you</CardDescription>
              </div>
              <Link to="/trainer/members">
                <Button variant="ghost" className="text-sm">
                  View all
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoadingMembers ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                </div>
              ) : recentMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No members assigned to you yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMembers.map((member: any) => (
                    <div 
                      key={member.id}
                      className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{member.users?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{member.users?.email || "No email"}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Joined {new Date(member.join_date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Attendance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Today's Attendance</CardTitle>
                <CardDescription>Track who's here today</CardDescription>
              </div>
              <Link to="/trainer/attendance">
                <Button variant="ghost" className="text-sm">
                  Manage
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoadingAttendance ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                </div>
              ) : todaysAttendance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No attendance records for today.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todaysAttendance.map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.name}</TableCell>
                        <TableCell>
                          {record.status === "present" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Present
                            </span>
                          ) : record.status === "absent" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <X className="h-3 w-3 mr-1" />
                              Absent
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Not marked
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TrainerDashboard;
