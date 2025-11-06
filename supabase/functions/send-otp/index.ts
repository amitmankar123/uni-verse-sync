import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOtpRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SendOtpRequest = await req.json();
    console.log("Sending OTP to:", email);

    if (!email) {
      throw new Error("Email is required");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in a temporary way (you might want to use a dedicated OTP table)
    // For now, we'll use the user metadata during sign-in
    
    // Check if user exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users.find(u => u.email === email);

    if (!userExists) {
      return new Response(
        JSON.stringify({ error: "User not found. Please contact admin." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send OTP email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Campus Connect <onboarding@resend.dev>",
        to: [email],
        subject: "Your Campus Connect OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Campus Connect</h1>
            <p>Your OTP for login is:</p>
            <h2 style="background: #f3f4f6; padding: 20px; text-align: center; letter-spacing: 8px; font-size: 32px; color: #1f2937;">
              ${otp}
            </h2>
            <p>This OTP is valid for 10 minutes.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.json();
      throw new Error(`Email send failed: ${JSON.stringify(error)}`);
    }

    const emailResult = await emailResponse.json();

    console.log("Email sent successfully:", emailResult);

    // Store OTP temporarily (in production, use Redis or a dedicated table with expiry)
    // For now, we'll return it and handle verification in the verify-otp function
    // In a real implementation, store this securely with expiration

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully",
        // In production, don't return OTP! This is for development only
        otp: otp 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
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