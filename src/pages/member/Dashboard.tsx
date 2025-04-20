
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
  CardFooter,
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
import { Link } from "react-router-dom";
import { 
  Calendar, 
  Dumbbell, 
  User, 
  CreditCard,
  Check,
  X,
  ChevronRight,
  Info,
} from "lucide-react";

const MemberDashboard = () => {
  const { userData } = useAuth();
  const [memberId, setMemberId] = useState<string | null>(null);

  // First, get member ID from user ID
  useEffect(() => {
    const fetchMemberId = async () => {
      if (!userData?.id) return;

      try {
        const { data, error } = await supabase
          .from("members")
          .select("id")
          .eq("user_id", userData.id)
          .single();

        if (error) throw error;
        if (data) {
          setMemberId(data.id);
        }
      } catch (error) {
        console.error("Error fetching member ID:", error);
      }
    };

    fetchMemberId();
  }, [userData]);

  // Fetch member info with trainer details
  const { data: memberInfo, isLoading: isLoadingMember } = useQuery({
    queryKey: ["memberInfo", memberId],
    queryFn: async () => {
      if (!memberId) return null;

      try {
        const { data, error } = await supabase
          .from("members")
          .select(`
            id,
            user_id,
            join_date,
            trainers (
              id,
              users (
                id,
                name
              )
            ),
            memberships (
              id,
              name,
              duration_days,
              price
            )
          `)
          .eq("id", memberId)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error fetching member info:", error);
        return null;
      }
    },
    enabled: !!memberId,
  });

  // Fetch workout plan
  const { data: workoutPlan, isLoading: isLoadingWorkout } = useQuery({
    queryKey: ["workoutPlan", memberId],
    queryFn: async () => {
      if (!memberId) return null;

      try {
        const { data, error } = await supabase
          .from("workout_plans")
          .select(`
            id,
            exercises_json,
            created_by,
            trainers (
              users (
                name
              )
            )
          `)
          .eq("member_id", memberId)
          .single();

        if (error && error.code !== "PGRST116") throw error; // PGRST116 is "no rows returned"
        
        return data || null;
      } catch (error) {
        console.error("Error fetching workout plan:", error);
        return null;
      }
    },
    enabled: !!memberId,
  });

  // Fetch recent attendance
  const { data: recentAttendance = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["recentAttendance", memberId],
    queryFn: async () => {
      if (!memberId) return [];

      try {
        const { data, error } = await supabase
          .from("attendance")
          .select("id, date, status")
          .eq("member_id", memberId)
          .order("date", { ascending: false })
          .limit(5);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching attendance:", error);
        return [];
      }
    },
    enabled: !!memberId,
  });

  // Fetch recent payments
  const { data: recentPayments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ["recentPayments", memberId],
    queryFn: async () => {
      if (!memberId) return [];

      try {
        const { data, error } = await supabase
          .from("payments")
          .select("id, amount, payment_date, method")
          .eq("member_id", memberId)
          .order("payment_date", { ascending: false })
          .limit(3);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching payments:", error);
        return [];
      }
    },
    enabled: !!memberId,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Member Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* Member Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Your Information</CardTitle>
            <CardDescription>Your membership details and assigned trainer</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMember ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
              </div>
            ) : memberInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-500" />
                    Member Since
                  </h3>
                  <p className="text-muted-foreground">
                    {new Date(memberInfo.join_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2 text-green-500" />
                    Assigned Trainer
                  </h3>
                  <p className="text-muted-foreground">
                    {memberInfo.trainers?.users?.name || "No trainer assigned"}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-purple-500" />
                    Membership Plan
                  </h3>
                  <p className="text-muted-foreground">
                    {memberInfo.memberships?.name || "No plan assigned"}
                    {memberInfo.memberships && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        ${parseFloat(memberInfo.memberships.price).toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-yellow-500" />
                    Duration
                  </h3>
                  <p className="text-muted-foreground">
                    {memberInfo.memberships
                      ? `${memberInfo.memberships.duration_days} days`
                      : "Not specified"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>No membership information available.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Your Workout Plan</CardTitle>
            <CardDescription>Exercise routine designed for you</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingWorkout ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
              </div>
            ) : workoutPlan ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Created by: {workoutPlan.trainers?.users?.name || "Unknown trainer"}
                </div>
                
                {workoutPlan.exercises_json && typeof workoutPlan.exercises_json === 'object' ? (
                  <div className="space-y-4">
                    {Array.isArray(workoutPlan.exercises_json) ? (
                      workoutPlan.exercises_json.map((exercise: any, index) => (
                        <div key={index} className="border rounded-md p-4">
                          <h3 className="font-medium flex items-center">
                            <Dumbbell className="h-4 w-4 mr-2 text-blue-500" />
                            {exercise.name || `Exercise ${index + 1}`}
                          </h3>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Sets:</span>{" "}
                              {exercise.sets || "N/A"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Reps:</span>{" "}
                              {exercise.reps || "N/A"}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Rest:</span>{" "}
                              {exercise.rest || "N/A"}
                            </div>
                          </div>
                          {exercise.notes && (
                            <p className="mt-2 text-sm italic text-muted-foreground">
                              {exercise.notes}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>Workout plan available but in unexpected format.</p>
                    )}
                  </div>
                ) : (
                  <p>Workout plan details not available.</p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-muted-foreground">No workout plan assigned yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your trainer will create one for you soon.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link to="/member/workout-plan" className="w-full">
              <Button variant="outline" className="w-full">
                View Full Workout Plan
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attendance Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Attendance</CardTitle>
                <CardDescription>Your gym check-ins</CardDescription>
              </div>
              <Link to="/member/attendance">
                <Button variant="ghost" className="text-sm">
                  View all
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoadingAttendance ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                </div>
              ) : recentAttendance.length === 0 ? (
                <div className="text-center py-8">
                  <Info className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">No attendance records yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentAttendance.map((record: any) => (
                    <div 
                      key={record.id} 
                      className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0"
                    >
                      <div>
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                      <div>
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payments Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Your payment history</CardDescription>
              </div>
              <Link to="/member/payments">
                <Button variant="ghost" className="text-sm">
                  View all
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoadingPayments ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                </div>
              ) : recentPayments.length === 0 ? (
                <div className="text-center py-8">
                  <Info className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">No payment records yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${parseFloat(payment.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.method}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feedback Section */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Feedback</CardTitle>
            <CardDescription>Tell us about your experience</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to="/member/feedback" className="w-full">
              <Button className="w-full">Submit Feedback</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MemberDashboard;
