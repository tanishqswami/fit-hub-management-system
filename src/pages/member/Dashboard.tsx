import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Dumbbell, User } from "lucide-react";
import { format } from "date-fns";

interface WorkoutPlan {
  id: number;
  member_id: string;
  trainer_id: string;
  created_at: string;
  plan_details: string;
  trainer_name?: string;
}

interface Attendance {
  id: number;
  member_id: string;
  check_in_time: string;
  check_out_time: string | null;
}

const MemberDashboard = () => {
  const { userData } = useAuth();
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentAttendanceId, setCurrentAttendanceId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // In the component, update the fetchWorkoutPlan function
  const fetchWorkoutPlan = useCallback(async () => {
    if (!userData) return;

    const { data, error } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("member_id", userData.id.toString()) // Convert to string
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // No rows returned
        console.error("Error fetching workout plan:", error);
      }
      return;
    }

    setWorkoutPlan(data);
  }, [userData]);

  const fetchTrainerName = useCallback(async () => {
    if (!workoutPlan?.trainer_id) return;

    const { data, error } = await supabase
      .from("users")
      .select("name")
      .eq("id", workoutPlan.trainer_id)
      .single();

    if (error) {
      console.error("Error fetching trainer name:", error);
      return;
    }

    setWorkoutPlan(prev => prev ? { ...prev, trainer_name: data.name } : null);
  }, [workoutPlan?.trainer_id]);

  const fetchAttendanceHistory = useCallback(async () => {
    if (!userData) return;

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("member_id", userData.id)
      .order("check_in_time", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching attendance history:", error);
      return;
    }

    setAttendanceHistory(data || []);

    // Check if user is currently checked in
    const currentAttendance = data?.find(record => !record.check_out_time);
    if (currentAttendance) {
      setIsCheckedIn(true);
      setCurrentAttendanceId(currentAttendance.id);
    } else {
      setIsCheckedIn(false);
      setCurrentAttendanceId(null);
    }
  }, [userData]);

  const handleCheckIn = async () => {
    if (!userData) return;

    const { data, error } = await supabase
      .from("attendance")
      .insert([
        {
          member_id: userData.id,
          check_in_time: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Error checking in:", error);
      return;
    }

    if (data && data.length > 0) {
      setIsCheckedIn(true);
      setCurrentAttendanceId(data[0].id);
      await fetchAttendanceHistory();
    }
  };

  const handleCheckOut = async () => {
    if (!currentAttendanceId) return;

    const { error } = await supabase
      .from("attendance")
      .update({
        check_out_time: new Date().toISOString(),
      })
      .eq("id", currentAttendanceId);

    if (error) {
      console.error("Error checking out:", error);
      return;
    }

    setIsCheckedIn(false);
    setCurrentAttendanceId(null);
    await fetchAttendanceHistory();
  };

  useEffect(() => {
    fetchWorkoutPlan();
    fetchAttendanceHistory();
  }, [fetchWorkoutPlan, fetchAttendanceHistory]);

  useEffect(() => {
    if (workoutPlan?.trainer_id) {
      fetchTrainerName();
    }
  }, [workoutPlan?.trainer_id, fetchTrainerName]);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Member Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workout">Workout Plan</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Welcome, {userData?.name}</CardTitle>
                <CardDescription>Member Dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-primary" />
                    <span>Email: {userData?.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    <span>Role: {userData?.role}</span>
                  </div>
                  
                  <div className="mt-6">
                    {isCheckedIn ? (
                      <Button onClick={handleCheckOut} variant="destructive">
                        Check Out
                      </Button>
                    ) : (
                      <Button onClick={handleCheckIn}>
                        Check In
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Current Workout Plan</CardTitle>
                <CardDescription>
                  {workoutPlan ? `Assigned by ${workoutPlan.trainer_name || 'your trainer'}` : 'No workout plan assigned yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {workoutPlan ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">
                      Created on {format(new Date(workoutPlan.created_at), 'PPP')}
                    </p>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm">
                        {workoutPlan.plan_details}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">
                    You don't have any workout plan assigned yet. Please contact your trainer.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
              <CardDescription>Your last 5 gym visits</CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceHistory.length > 0 ? (
                <div className="space-y-4">
                  {attendanceHistory.slice(0, 5).map((record) => (
                    <div key={record.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{format(new Date(record.check_in_time), 'PPP')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span>
                          {format(new Date(record.check_in_time), 'p')} - 
                          {record.check_out_time 
                            ? format(new Date(record.check_out_time), ' p')
                            : ' Present'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No attendance records found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="workout">
          <Card>
            <CardHeader>
              <CardTitle>Your Workout Plan</CardTitle>
              <CardDescription>
                {workoutPlan ? `Assigned by ${workoutPlan.trainer_name || 'your trainer'}` : 'No workout plan assigned yet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workoutPlan ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Created on {format(new Date(workoutPlan.created_at), 'PPP')}</span>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <pre className="whitespace-pre-wrap">
                      {workoutPlan.plan_details}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Dumbbell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Workout Plan Yet</h3>
                  <p className="text-gray-500 mb-6">
                    You don't have any workout plan assigned yet. Please contact your trainer.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>Your gym visit records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                {isCheckedIn ? (
                  <Button onClick={handleCheckOut} variant="destructive">
                    Check Out
                  </Button>
                ) : (
                  <Button onClick={handleCheckIn}>
                    Check In
                  </Button>
                )}
              </div>
              
              {attendanceHistory.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check In
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check Out
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendanceHistory.map((record) => {
                        const checkInDate = new Date(record.check_in_time);
                        const checkOutDate = record.check_out_time ? new Date(record.check_out_time) : null;
                        const duration = checkOutDate 
                          ? Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60)) 
                          : null;
                        
                        return (
                          <tr key={record.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {format(checkInDate, 'PPP')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {format(checkInDate, 'p')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {checkOutDate ? format(checkOutDate, 'p') : 'Present'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {duration ? `${duration} minutes` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Attendance Records</h3>
                  <p className="text-gray-500">
                    You haven't checked in to the gym yet. Use the Check In button when you arrive.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>View and manage your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <span className="font-medium">Name:</span>
                  <span>{userData?.name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-primary" />
                  <span className="font-medium">Email:</span>
                  <span>{userData?.email}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  <span className="font-medium">Role:</span>
                  <span>{userData?.role}</span>
                </div>
                
                <div className="pt-4">
                  <Button variant="outline">Edit Profile</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MemberDashboard;
