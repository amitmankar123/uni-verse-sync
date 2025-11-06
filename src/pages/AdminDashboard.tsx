import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, LogOut, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [showAddUser, setShowAddUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    photoUrl: "",
    role: "student" as "admin" | "teacher" | "student",
    uniqueId: "",
    enrollmentNumber: "",
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("create-user", {
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: `${formData.role} added successfully!`,
      });

      // Reset form
      setFormData({
        email: "",
        fullName: "",
        photoUrl: "",
        role: "student",
        uniqueId: "",
        enrollmentNumber: "",
      });
      setShowAddUser(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
            <span className="text-2xl font-bold text-gradient">Admin Panel</span>
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
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gradient">Admin Dashboard</h1>
            <Button onClick={() => setShowAddUser(!showAddUser)} className="hover-lift">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          {showAddUser && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Add New User</h2>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="photoUrl">Photo URL (optional)</Label>
                      <Input
                        id="photoUrl"
                        type="url"
                        value={formData.photoUrl}
                        onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      />
                    </div>
                    {formData.role === "teacher" && (
                      <div>
                        <Label htmlFor="uniqueId">Teacher Unique ID</Label>
                        <Input
                          id="uniqueId"
                          value={formData.uniqueId}
                          onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
                          required
                        />
                      </div>
                    )}
                    {formData.role === "student" && (
                      <div>
                        <Label htmlFor="enrollmentNumber">Enrollment Number</Label>
                        <Input
                          id="enrollmentNumber"
                          value={formData.enrollmentNumber}
                          onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                          required
                        />
                      </div>
                    )}
                  </div>
                  <Button type="submit" disabled={loading} className="w-full hover-lift">
                    {loading ? "Adding..." : "Add User"}
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 card-hover">
              <div className="flex items-center gap-4">
                <Users className="h-12 w-12 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold">Total Users</h3>
                  <p className="text-muted-foreground">Manage all users</p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;