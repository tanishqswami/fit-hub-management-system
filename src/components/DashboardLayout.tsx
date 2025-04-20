
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  Dumbbell, 
  Calendar, 
  CreditCard,
  MessageSquare,
  LogOut,
  Menu,
  X,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
}

const SidebarItem = ({ icon, label, href, isActive }: SidebarItemProps) => (
  <Link to={href} className="w-full">
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={`w-full justify-start ${isActive ? "bg-secondary" : ""}`}
    >
      <div className="flex items-center gap-x-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Button>
  </Link>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { userData, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Define routes based on user role
  let routes = [];
  if (userData?.role === "admin") {
    routes = [
      {
        icon: <LayoutDashboard className="h-5 w-5" />,
        label: "Dashboard",
        href: "/admin",
      },
      {
        icon: <Users className="h-5 w-5" />,
        label: "Users",
        href: "/admin/users",
      },
      {
        icon: <Dumbbell className="h-5 w-5" />,
        label: "Memberships",
        href: "/admin/memberships",
      },
      {
        icon: <Calendar className="h-5 w-5" />,
        label: "Attendance",
        href: "/admin/attendance",
      },
      {
        icon: <CreditCard className="h-5 w-5" />,
        label: "Payments",
        href: "/admin/payments",
      },
      {
        icon: <MessageSquare className="h-5 w-5" />,
        label: "Feedback",
        href: "/admin/feedback",
      },
    ];
  } else if (userData?.role === "trainer") {
    routes = [
      {
        icon: <LayoutDashboard className="h-5 w-5" />,
        label: "Dashboard",
        href: "/trainer",
      },
      {
        icon: <Users className="h-5 w-5" />,
        label: "Members",
        href: "/trainer/members",
      },
      {
        icon: <Dumbbell className="h-5 w-5" />,
        label: "Workout Plans",
        href: "/trainer/workout-plans",
      },
      {
        icon: <Calendar className="h-5 w-5" />,
        label: "Attendance",
        href: "/trainer/attendance",
      },
    ];
  } else if (userData?.role === "member") {
    routes = [
      {
        icon: <LayoutDashboard className="h-5 w-5" />,
        label: "Dashboard",
        href: "/member",
      },
      {
        icon: <Dumbbell className="h-5 w-5" />,
        label: "Workout Plan",
        href: "/member/workout-plan",
      },
      {
        icon: <Calendar className="h-5 w-5" />,
        label: "Attendance",
        href: "/member/attendance",
      },
      {
        icon: <CreditCard className="h-5 w-5" />,
        label: "Payments",
        href: "/member/payments",
      },
      {
        icon: <MessageSquare className="h-5 w-5" />,
        label: "Feedback",
        href: "/member/feedback",
      },
    ];
  }

  const onSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="h-full">
      <div className="hidden md:flex h-full w-72 flex-col fixed inset-y-0 z-50">
        <div className="h-full border-r flex flex-col overflow-y-auto bg-white">
          <div className="py-8 px-6 flex items-center justify-center">
            <Link to="/" className="flex items-center gap-2">
              <Dumbbell className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">FitHub</span>
            </Link>
          </div>
          <div className="flex flex-col w-full">
            {routes.map((route) => (
              <SidebarItem
                key={route.href}
                icon={route.icon}
                label={route.label}
                href={route.href}
                isActive={location.pathname === route.href}
              />
            ))}
          </div>
          <div className="p-4 mt-auto">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-6 w-6" />
              <div>
                <p className="text-sm font-medium">{userData?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{userData?.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={onSignOut}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden px-4 py-2 border-b h-16 flex items-center">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <div className="py-6 px-6 flex items-center justify-between border-b">
              <Link 
                to="/" 
                className="flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <Dumbbell className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">FitHub</span>
              </Link>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex flex-col p-2">
              {routes.map((route) => (
                <div key={route.href} onClick={() => setIsOpen(false)}>
                  <SidebarItem
                    icon={route.icon}
                    label={route.label}
                    href={route.href}
                    isActive={location.pathname === route.href}
                  />
                </div>
              ))}
              <div className="mt-auto p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-6 w-6" />
                  <div>
                    <p className="text-sm font-medium">{userData?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userData?.role}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onSignOut}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center justify-center w-full">
          <Link to="/" className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">FitHub</span>
          </Link>
        </div>
      </div>

      <main className="md:pl-72 pt-16 md:pt-0 min-h-screen bg-gray-50">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
