import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gradient">Campus Connect</span>
          </div>
          <Button onClick={handleLogout} variant="outline" className="hover-lift">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </motion.nav>

      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gradient mb-8">Welcome to Your Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 card-hover">
              <h3 className="text-xl font-semibold mb-2">Quick Stats</h3>
              <p className="text-muted-foreground">Your dashboard is being set up...</p>
            </Card>
            
            <Card className="p-6 card-hover">
              <h3 className="text-xl font-semibold mb-2">Recent Activity</h3>
              <p className="text-muted-foreground">No recent activity</p>
            </Card>
            
            <Card className="p-6 card-hover">
              <h3 className="text-xl font-semibold mb-2">Notifications</h3>
              <p className="text-muted-foreground">No new notifications</p>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
