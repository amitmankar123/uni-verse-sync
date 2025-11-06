import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

const editUserSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  photoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  role: z.enum(["admin", "teacher", "student"]),
  uniqueId: z.string().optional(),
  enrollmentNumber: z.string().optional(),
});

interface User {
  id: string;
  email: string;
  full_name: string;
  photo_url?: string;
  role: string;
  teacher_unique_id?: string;
  student_enrollment?: string;
}

export const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeleteingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    photoUrl: "",
    role: "student" as "admin" | "teacher" | "student",
    uniqueId: "",
    enrollmentNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          photo_url
        `);

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch teacher data
      const { data: teachers, error: teachersError } = await supabase
        .from('teachers')
        .select('user_id, unique_id');

      if (teachersError) throw teachersError;

      // Fetch student data
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('user_id, enrollment_number');

      if (studentsError) throw studentsError;

      // Combine all data
      const usersData = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const teacher = teachers?.find(t => t.user_id === profile.id);
        const student = students?.find(s => s.user_id === profile.id);

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name || "",
          photo_url: profile.photo_url,
          role: userRole?.role || "student",
          teacher_unique_id: teacher?.unique_id,
          student_enrollment: student?.enrollment_number,
        };
      }) || [];

      setUsers(usersData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      fullName: user.full_name,
      photoUrl: user.photo_url || "",
      role: user.role as any,
      uniqueId: user.teacher_unique_id || "",
      enrollmentNumber: user.student_enrollment || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    try {
      editUserSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    if (!editingUser) return;

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("edit-user", {
        body: {
          userId: editingUser.id,
          ...formData,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: "User updated successfully!",
      });

      setEditDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: {
          userId: deletingUser.id,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: "User deleted successfully!",
      });

      setDeleteingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "teacher":
        return "default";
      case "student":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>ID/Enrollment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.teacher_unique_id || user.student_enrollment || "-"}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Dialog open={editDialogOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                    setEditDialogOpen(open);
                    if (!open) setEditingUser(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="edit-email">Email</Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-fullName">Full Name</Label>
                          <Input
                            id="edit-fullName"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-role">Role</Label>
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
                        {formData.role === "teacher" && (
                          <div>
                            <Label htmlFor="edit-uniqueId">Teacher Unique ID</Label>
                            <Input
                              id="edit-uniqueId"
                              value={formData.uniqueId}
                              onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
                            />
                          </div>
                        )}
                        {formData.role === "student" && (
                          <div>
                            <Label htmlFor="edit-enrollmentNumber">Enrollment Number</Label>
                            <Input
                              id="edit-enrollmentNumber"
                              value={formData.enrollmentNumber}
                              onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                            />
                          </div>
                        )}
                        <div>
                          <Label htmlFor="edit-photoUrl">Photo URL (optional)</Label>
                          <Input
                            id="edit-photoUrl"
                            type="url"
                            value={formData.photoUrl}
                            onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                          />
                        </div>
                        <Button type="submit" disabled={submitting} className="w-full">
                          {submitting ? "Saving..." : "Save Changes"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteingUser(user)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeleteingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for{" "}
              <strong>{deletingUser?.full_name}</strong> ({deletingUser?.email}).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
