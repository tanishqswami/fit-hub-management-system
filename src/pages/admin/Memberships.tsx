
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EditIcon, PlusIcon, Trash2Icon } from "lucide-react";

const membershipFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  duration_days: z.coerce.number().int().positive("Duration must be a positive number"),
  price: z.coerce.number().positive("Price must be a positive number"),
});

type MembershipFormValues = z.infer<typeof membershipFormSchema>;

const AdminMemberships = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<any>(null);

  // Fetch memberships
  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ["memberships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .order("name");

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch memberships",
        });
        return [];
      }
      
      return data;
    },
  });

  const form = useForm<MembershipFormValues>({
    resolver: zodResolver(membershipFormSchema),
    defaultValues: {
      name: "",
      duration_days: 30,
      price: 0,
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: MembershipFormValues) => {
      const { data: result, error } = await supabase
        .from("memberships")
        .insert([data])
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      setIsCreating(false);
      form.reset();
      toast({
        title: "Success",
        description: "Membership plan created successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create membership: ${error.message}`,
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: MembershipFormValues & { id: string }) => {
      const { id, ...updateData } = data;
      
      const { data: result, error } = await supabase
        .from("memberships")
        .update(updateData)
        .eq("id", id)
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      setIsEditing(false);
      setSelectedMembership(null);
      form.reset();
      toast({
        title: "Success",
        description: "Membership updated successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update membership: ${error.message}`,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("memberships")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast({
        title: "Success",
        description: "Membership deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete membership: ${error.message}`,
      });
    },
  });

  const onSubmit = (data: MembershipFormValues) => {
    if (isEditing && selectedMembership) {
      updateMutation.mutate({
        id: selectedMembership.id,
        ...data,
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (membership: any) => {
    setSelectedMembership(membership);
    form.setValue("name", membership.name);
    form.setValue("duration_days", membership.duration_days);
    form.setValue("price", membership.price);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this membership?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Membership Plans</h1>
          <Button onClick={() => {
            form.reset();
            setIsCreating(true);
          }}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New Plan
          </Button>
        </div>

        <div className="bg-white rounded-md shadow">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
            </div>
          ) : memberships.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No membership plans available. Create one to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Duration (Days)</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((membership: any) => (
                  <TableRow key={membership.id}>
                    <TableCell className="font-medium">{membership.name}</TableCell>
                    <TableCell>{membership.duration_days}</TableCell>
                    <TableCell>${parseFloat(membership.price).toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(membership)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(membership.id)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={isCreating || isEditing} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setIsEditing(false);
            setSelectedMembership(null);
            form.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Membership Plan" : "Create New Membership Plan"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update the details of the membership plan." 
                : "Add a new membership plan to your offerings."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Basic Monthly" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="duration_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Days)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                    setSelectedMembership(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center">
                      <div className="w-4 h-4 mr-2 border-2 border-t-white border-white/30 rounded-full animate-spin"></div>
                      {isEditing ? "Updating..." : "Creating..."}
                    </span>
                  ) : (
                    isEditing ? "Update Plan" : "Create Plan"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminMemberships;
