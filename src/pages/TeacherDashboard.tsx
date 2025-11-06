import { motion } from "framer-motion";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, QrCode, BookOpen, Calendar, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";

const TeacherDashboard = () => {
  const { signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);

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
            <span className="text-2xl font-bold text-gradient">Teacher Portal</span>
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
          className="space-y-8"
        >
          <h1 className="text-4xl font-bold text-gradient">Teacher Dashboard</h1>

          {!activeSection ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card
                className="p-6 card-hover cursor-pointer"
                onClick={() => setActiveSection("qr-code")}
              >
                <div className="flex items-center gap-4">
                  <QrCode className="h-12 w-12 text-primary" />
                  <div>
                    <h3 className="text-xl font-semibold">QR Code</h3>
                    <p className="text-muted-foreground">Generate for attendance</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 card-hover cursor-pointer">
                <div className="flex items-center gap-4">
                  <Users className="h-12 w-12 text-primary" />
                  <div>
                    <h3 className="text-xl font-semibold">Attendance</h3>
                    <p className="text-muted-foreground">View & manage</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 card-hover cursor-pointer">
                <div className="flex items-center gap-4">
                  <BookOpen className="h-12 w-12 text-primary" />
                  <div>
                    <h3 className="text-xl font-semibold">Assignments</h3>
                    <p className="text-muted-foreground">Add & manage</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 card-hover cursor-pointer">
                <div className="flex items-center gap-4">
                  <Calendar className="h-12 w-12 text-primary" />
                  <div>
                    <h3 className="text-xl font-semibold">Schedule</h3>
                    <p className="text-muted-foreground">Manage classes</p>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setActiveSection(null)}
                className="hover-lift"
              >
                ← Back to Dashboard
              </Button>

              {activeSection === "qr-code" && <QRCodeGenerator />}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherDashboard;