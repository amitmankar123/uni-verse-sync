import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Clock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";

interface QRCodeData {
  id: string;
  data: string;
  expiresAt: string;
}

export const QRCodeGenerator = () => {
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expiryMinutes, setExpiryMinutes] = useState(10);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!qrCode) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const expiry = new Date(qrCode.expiresAt).getTime();
      const remaining = Math.max(0, expiry - now);
      
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setQrCode(null);
        toast({
          title: "QR Code Expired",
          description: "Please generate a new code for attendance.",
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [qrCode, toast]);

  const generateQR = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("generate-qr", {
        body: { expiryMinutes },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setQrCode(data.qrCode);
      
      toast({
        title: "Success",
        description: `QR Code generated! Valid for ${expiryMinutes} minutes.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate QR code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <QrCode className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Generate Attendance QR Code</h2>
        </div>

        {!qrCode ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="expiryMinutes">Valid for (minutes)</Label>
              <Input
                id="expiryMinutes"
                type="number"
                min="1"
                max="60"
                value={expiryMinutes}
                onChange={(e) => setExpiryMinutes(parseInt(e.target.value) || 10)}
                className="mt-2"
              />
            </div>
            <Button
              onClick={generateQR}
              disabled={loading}
              className="w-full hover-lift"
              size="lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Code
                </>
              )}
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-lg flex justify-center">
              <QRCode value={qrCode.data} size={256} />
            </div>

            <div className="flex items-center justify-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5 text-primary animate-pulse" />
              <span>Time Remaining: {formatTime(timeRemaining)}</span>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground text-center">
                Students can scan this code to mark their attendance
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: "100%" }}
                  animate={{
                    width: `${(timeRemaining / (expiryMinutes * 60000)) * 100}%`,
                  }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>

            <Button
              onClick={() => setQrCode(null)}
              variant="outline"
              className="w-full"
            >
              Generate New Code
            </Button>
          </motion.div>
        )}
      </Card>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          How it works
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Generate a time-limited QR code for your class</li>
          <li>• Students scan the code using their mobile devices</li>
          <li>• Attendance is automatically recorded in real-time</li>
          <li>• Code expires after the specified duration for security</li>
        </ul>
      </Card>
    </div>
  );
};