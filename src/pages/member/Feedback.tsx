
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  content: z
    .string()
    .min(5, { message: "Feedback must be at least 5 characters" })
    .max(500, { message: "Feedback cannot exceed 500 characters" }),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

const MemberFeedback = () => {
  const { userData } = useAuth();
  const queryClient = useQueryClient();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [hoveredRating, setHoveredRating] = useState(0);

  // Get member ID from user ID
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

  // Fetch previous feedback
  const { data: previousFeedback, isLoading } = useQuery({
    queryKey: ["memberFeedback", memberId],
    queryFn: async () => {
      if (!memberId) return [];

      try {
        const { data, error } = await supabase
          .from("feedback")
          .select("*")
          .eq("member_id", memberId)
          .order("date", { ascending: false })
          .limit(5);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching feedback:", error);
        return [];
      }
    },
    enabled: !!memberId,
  });

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 0,
      content: "",
    },
  });

  // Mutation for submitting feedback
  const submitFeedbackMutation = useMutation({
    mutationFn: async (values: FeedbackFormValues) => {
      if (!memberId) throw new Error("Member ID not found");

      const { data, error } = await supabase
        .from("feedback")
        .insert([
          {
            member_id: memberId,
            rating: values.rating,
            content: values.content,
            date: new Date().toISOString().split('T')[0],
          },
        ])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
      form.reset({
        rating: 0,
        content: "",
      });
      queryClient.invalidateQueries({ queryKey: ["memberFeedback"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to submit feedback: ${error.message}`,
      });
    },
  });

  const onSubmit = (values: FeedbackFormValues) => {
    submitFeedbackMutation.mutate(values);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Submit Feedback</h1>
        <p className="text-muted-foreground">
          We value your feedback! Let us know about your experience at our gym.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submit Feedback Card */}
          <Card>
            <CardHeader>
              <CardTitle>New Feedback</CardTitle>
              <CardDescription>Tell us what you think</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <Star
                                key={rating}
                                className={`h-8 w-8 cursor-pointer ${
                                  rating <= (hoveredRating || field.value)
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-300"
                                }`}
                                onClick={() => field.onChange(rating)}
                                onMouseEnter={() => setHoveredRating(rating)}
                                onMouseLeave={() => setHoveredRating(0)}
                              />
                            ))}
                          </div>
                        </FormControl>
                        <FormDescription>
                          Rate your experience from 1 to 5 stars
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Feedback</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your experience..."
                            className="min-h-[120px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Please provide specific feedback to help us improve
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={submitFeedbackMutation.isPending}
                  >
                    {submitFeedbackMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-t-white border-white/30 rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      "Submit Feedback"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Previous Feedback Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Previous Feedback</CardTitle>
              <CardDescription>Feedback you've submitted before</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                </div>
              ) : previousFeedback && previousFeedback.length > 0 ? (
                <div className="space-y-4">
                  {previousFeedback.map((feedback) => (
                    <div
                      key={feedback.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= feedback.rating
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(feedback.date).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-sm">{feedback.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You haven't submitted any feedback yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MemberFeedback;
