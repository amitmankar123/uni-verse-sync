import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  fullName: string;
  photoUrl?: string;
  role: 'admin' | 'teacher' | 'student';
  uniqueId?: string; // For teachers
  enrollmentNumber?: string; // For students
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

    // Check if requesting user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .single();

    if (roleData?.role !== 'admin') {
      throw new Error("Only admins can create users");
    }

    const { email, fullName, photoUrl, role, uniqueId, enrollmentNumber }: CreateUserRequest = await req.json();

    console.log("Creating user:", email, "Role:", role);

    // Create auth user with a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      throw createError;
    }

    if (!newUser.user) {
      throw new Error("Failed to create user");
    }

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email,
        full_name: fullName,
        photo_url: photoUrl,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      throw profileError;
    }

    // Create role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role,
      });

    if (roleError) {
      console.error("Role creation error:", roleError);
      throw roleError;
    }

    // Create teacher or student record
    if (role === 'teacher' && uniqueId) {
      const { error: teacherError } = await supabase
        .from('teachers')
        .insert({
          user_id: newUser.user.id,
          unique_id: uniqueId,
        });

      if (teacherError) {
        console.error("Teacher record error:", teacherError);
        throw teacherError;
      }
    } else if (role === 'student' && enrollmentNumber) {
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: newUser.user.id,
          enrollment_number: enrollmentNumber,
        });

      if (studentError) {
        console.error("Student record error:", studentError);
        throw studentError;
      }
    }

    console.log("User created successfully:", email);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email,
          role,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in create-user function:", error);
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