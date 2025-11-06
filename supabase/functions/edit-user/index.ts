import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EditUserRequest {
  userId: string;
  email?: string;
  fullName?: string;
  photoUrl?: string;
  role?: 'admin' | 'teacher' | 'student';
  uniqueId?: string;
  enrollmentNumber?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the requesting user is an admin
    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !requestingUser) {
      throw new Error("Unauthorized");
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .single();

    if (roleData?.role !== 'admin') {
      throw new Error("Only admins can edit users");
    }

    const { userId, email, fullName, photoUrl, role, uniqueId, enrollmentNumber }: EditUserRequest = await req.json();

    console.log("Editing user:", userId);

    // Update profile if provided
    if (email || fullName || photoUrl) {
      const updateData: any = {};
      if (email) updateData.email = email;
      if (fullName) updateData.full_name = fullName;
      if (photoUrl !== undefined) updateData.photo_url = photoUrl;

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw profileError;
      }

      // Update auth email if changed
      if (email) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(
          userId,
          { email }
        );
        if (emailError) {
          console.error("Email update error:", emailError);
          throw emailError;
        }
      }
    }

    // Update role if provided
    if (role) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (roleError) {
        console.error("Role update error:", roleError);
        throw roleError;
      }
    }

    // Update teacher/student specific data
    if (role === 'teacher' && uniqueId !== undefined) {
      // Check if teacher record exists
      const { data: existingTeacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingTeacher) {
        const { error: teacherError } = await supabase
          .from('teachers')
          .update({ unique_id: uniqueId })
          .eq('user_id', userId);

        if (teacherError) throw teacherError;
      } else {
        const { error: teacherError } = await supabase
          .from('teachers')
          .insert({ user_id: userId, unique_id: uniqueId });

        if (teacherError) throw teacherError;
      }
    } else if (role === 'student' && enrollmentNumber !== undefined) {
      // Check if student record exists
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingStudent) {
        const { error: studentError } = await supabase
          .from('students')
          .update({ enrollment_number: enrollmentNumber })
          .eq('user_id', userId);

        if (studentError) throw studentError;
      } else {
        const { error: studentError } = await supabase
          .from('students')
          .insert({ user_id: userId, enrollment_number: enrollmentNumber });

        if (studentError) throw studentError;
      }
    }

    console.log("User updated successfully:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "User updated successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in edit-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
