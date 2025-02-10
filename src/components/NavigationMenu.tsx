
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Home, FolderOpen } from "lucide-react";

export const NavigationMenu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 max-w-7xl mx-auto">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="flex items-center space-x-2"
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
            {user && (
              <Button
                variant="ghost"
                className="flex items-center space-x-2"
                onClick={() => navigate("/projects")}
              >
                <FolderOpen className="h-4 w-4" />
                <span>Projects</span>
              </Button>
            )}
          </div>
          <div>
            {user ? (
              <Button
                variant="ghost"
                className="flex items-center space-x-2"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="flex items-center space-x-2"
                onClick={() => navigate("/auth")}
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
