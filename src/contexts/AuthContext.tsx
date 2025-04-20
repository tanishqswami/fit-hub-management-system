
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: "admin" | "trainer" | "member";
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userData: UserData | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const setupAuth = async () => {
      setIsLoading(true);
      
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            setTimeout(async () => {
              await fetchUserData(currentSession.user.id);
            }, 0);
          } else {
            setUserData(null);
          }
        }
      );
      
      // Check for existing session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        await fetchUserData(currentSession.user.id);
      }
      
      setIsLoading(false);
      
      return () => {
        subscription.unsubscribe();
      };
    };
    
    setupAuth();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role")
        .eq("id", userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setUserData(data as UserData);
        redirectBasedOnRole(data.role);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
    }
  };

  const redirectBasedOnRole = (role: string) => {
    const currentPath = window.location.pathname;
    
    // Don't redirect if already on the correct dashboard
    if (
      (role === "admin" && currentPath.startsWith("/admin")) ||
      (role === "trainer" && currentPath.startsWith("/trainer")) ||
      (role === "member" && currentPath.startsWith("/member"))
    ) {
      return;
    }
    
    // Don't redirect if on auth page and just logged in
    if (currentPath === "/auth") {
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "trainer") {
        navigate("/trainer");
      } else if (role === "member") {
        navigate("/member");
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Successfully signed in",
      });
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    try {
      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Insert into users table
      const { error: userError } = await supabase
        .from("users")
        .insert([
          {
            id: authData.user.id,
            email,
            name,
            role,
          },
        ]);

      if (userError) throw userError;

      toast({
        title: "Account created",
        description: "You've successfully signed up",
      });
      
      // If user is a member or trainer, create appropriate record
      if (role === "member") {
        const { error: memberError } = await supabase
          .from("members")
          .insert([
            {
              user_id: authData.user.id,
              join_date: new Date().toISOString().split('T')[0],
            },
          ]);
        if (memberError) throw memberError;
      } else if (role === "trainer") {
        const { error: trainerError } = await supabase
          .from("trainers")
          .insert([
            {
              user_id: authData.user.id,
            },
          ]);
        if (trainerError) throw trainerError;
      }
    } catch (error: any) {
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      navigate("/auth");
      toast({
        title: "Signed out",
        description: "You've been signed out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userData,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
