import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, ScanLine, Calendar, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const StudentDashboard = () => {
  const { signOut } = useAuth();

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
            <span className="text-2xl font-bold text-gradient">Student Portal</span>
          </div>
          <Button onClick={signOut} variant="outline" className="hover-lift">
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
          <h1 className="text-4xl font-bold text-gradient mb-8">Student Dashboard</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 card-hover cursor-pointer">
              <div className="flex items-center gap-4">
                <ScanLine className="h-12 w-12 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold">Scan QR</h3>
                  <p className="text-muted-foreground">Mark attendance</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 card-hover cursor-pointer">
              <div className="flex items-center gap-4">
                <Calendar className="h-12 w-12 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold">My Attendance</h3>
                  <p className="text-muted-foreground">View records</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6 card-hover cursor-pointer">
              <div className="flex items-center gap-4">
                <BookOpen className="h-12 w-12 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold">Assignments</h3>
                  <p className="text-muted-foreground">View & submit</p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentDashboard;