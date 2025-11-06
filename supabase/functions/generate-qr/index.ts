import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateQrRequest {
  expiryMinutes?: number;
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

    // Check if user is a teacher
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacherData) {
      throw new Error("Only teachers can generate QR codes");
    }

    const { expiryMinutes = 10 }: GenerateQrRequest = await req.json().catch(() => ({}));

    // Generate unique QR data (combination of teacher ID, timestamp, and random string)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const qrData = `ATTENDANCE_${teacherData.id}_${timestamp}_${randomStr}`;

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Store QR code in database
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .insert({
        teacher_id: teacherData.id,
        qr_data: qrData,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (qrError) {
      console.error("QR code creation error:", qrError);
      throw qrError;
    }

    console.log("QR code generated successfully:", qrCode.id);

    return new Response(
      JSON.stringify({
        success: true,
        qrCode: {
          id: qrCode.id,
          data: qrData,
          expiresAt: expiresAt.toISOString(),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-qr function:", error);
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