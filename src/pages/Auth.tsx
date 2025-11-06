import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOtp, setIsOtp] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { email },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setSentOtp(data.otp); // In production, don't store this client-side
      setIsOtp(true);
      toast({
        title: "OTP Sent",
        description: "Check your email for the verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { email, otp, sentOtp },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Sign in with the magic link
      if (data.session) {
        const { error: signInError } = await supabase.auth.setSession({
          access_token: data.session.properties.access_token,
          refresh_token: data.session.properties.refresh_token,
        });

        if (signInError) throw signInError;

        toast({
          title: "Success",
          description: "Logged in successfully!",
        });

        // Navigate based on role
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            className="flex justify-center mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <GraduationCap className="h-16 w-16 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gradient mb-2">Campus Connect</h1>
          <p className="text-muted-foreground">Welcome back! Please sign in to continue.</p>
        </div>

        <Card className="p-8 card-hover bg-card/80 backdrop-blur-sm">
          {!isOtp ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button type="submit" className="w-full hover-lift" size="lg" disabled={loading}>
                  {loading ? "Sending..." : "Send OTP"}
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center text-sm text-muted-foreground"
              >
                An OTP will be sent to your registered email
              </motion.p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center mb-6"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-success/20 rounded-full mb-3">
                  <span className="text-2xl">📧</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  We've sent a verification code to
                  <br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  className="mt-2 text-center text-2xl tracking-widest"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <Button type="submit" className="w-full hover-lift" size="lg" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Login"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsOtp(false)}
                >
                  Change Email
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center text-sm text-muted-foreground"
              >
                Didn't receive the code?{" "}
                <button className="text-primary hover:underline" onClick={handleSendOtp}>
                  Resend OTP
                </button>
              </motion.p>
            </form>
          )}
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-6"
        >
          <Button variant="ghost" onClick={() => navigate("/")}>
            ← Back to Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;
