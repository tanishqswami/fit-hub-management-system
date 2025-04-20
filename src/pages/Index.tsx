
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dumbbell } from "lucide-react";

const Index = () => {
  const { userData, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && userData) {
      // Redirect based on user role
      if (userData.role === "admin") {
        navigate("/admin");
      } else if (userData.role === "trainer") {
        navigate("/trainer");
      } else if (userData.role === "member") {
        navigate("/member");
      }
    }
  }, [userData, isLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation bar */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto py-4 px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">FitHub</span>
          </div>
          
          <nav>
            <Link to="/auth">
              <Button variant="default">Sign In</Button>
            </Link>
          </nav>
        </div>
      </header>
      
      {/* Hero section */}
      <section className="flex-1 flex flex-col md:flex-row items-center">
        <div className="container mx-auto py-12 px-6 md:py-24 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0 md:pr-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Welcome to FitHub Management System</h1>
            <p className="text-lg mb-8 text-gray-600">
              A comprehensive platform for gym administrators, trainers, and members
              to manage workouts, track progress, and stay connected.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link to="/auth?tab=signup">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <div className="bg-gray-100 p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-6">Key Features</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary/10 p-2 rounded-full mr-4">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Role-Based Access</h3>
                    <p className="text-sm text-gray-600">Different interfaces for admins, trainers, and members</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary/10 p-2 rounded-full mr-4">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Workout Plan Management</h3>
                    <p className="text-sm text-gray-600">Create and track personalized workout plans</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary/10 p-2 rounded-full mr-4">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Attendance Tracking</h3>
                    <p className="text-sm text-gray-600">Monitor gym visits and participation</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary/10 p-2 rounded-full mr-4">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Payment Management</h3>
                    <p className="text-sm text-gray-600">Track and manage membership payments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-50 border-t py-8">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FitHub</span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} FitHub Management System. All rights reserved.
          </p>
        </div>
      </footer>
      
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
            <div className="w-6 h-6 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
            <p>Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
