import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MarkAttendanceRequest {
  qrData: string;
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

    // Verify the requesting user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is a student
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (studentError || !studentData) {
      throw new Error("Only students can mark attendance");
    }

    const { qrData }: MarkAttendanceRequest = await req.json();

    if (!qrData || !qrData.startsWith("ATTENDANCE_")) {
      throw new Error("Invalid QR code");
    }

    // Verify QR code exists and is not expired
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('id, teacher_id, expires_at')
      .eq('qr_data', qrData)
      .single();

    if (qrError || !qrCode) {
      throw new Error("Invalid QR code");
    }

    // Check if QR code has expired
    const now = new Date();
    const expiresAt = new Date(qrCode.expires_at);
    
    if (now > expiresAt) {
      throw new Error("QR code has expired");
    }

    // Check if student already marked attendance today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', studentData.id)
      .eq('date', today)
      .maybeSingle();

    if (existingAttendance) {
      throw new Error("Attendance already marked for today");
    }

    // Mark attendance
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .insert({
        student_id: studentData.id,
        teacher_id: qrCode.teacher_id,
        date: today,
        status: 'present',
        qr_scanned: true,
      })
      .select()
      .single();

    if (attendanceError) {
      console.error("Attendance marking error:", attendanceError);
      throw attendanceError;
    }

    console.log("Attendance marked successfully:", attendance.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Attendance marked successfully!",
        attendance: {
          id: attendance.id,
          date: attendance.date,
          status: attendance.status,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in mark-attendance function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);