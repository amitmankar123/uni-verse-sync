import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, CheckCircle2, XCircle, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QrReader } from "react-qr-reader";

export const QRScanner = () => {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleScan = async (data: string | null) => {
    if (!data || processing) return;

    setProcessing(true);
    setScanning(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data: response, error } = await supabase.functions.invoke("mark-attendance", {
        body: { qrData: data },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (response.error) throw new Error(response.error);

      setResult({ success: true, message: response.message });
      
      toast({
        title: "Success!",
        description: "Your attendance has been marked.",
      });
    } catch (error: any) {
      setResult({ success: false, message: error.message });
      
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      
      // Auto-reset after 3 seconds
      setTimeout(() => {
        setResult(null);
      }, 3000);
    }
  };

  const handleError = (error: any) => {
    console.error("QR Scanner Error:", error);
    toast({
      title: "Camera Error",
      description: "Please allow camera access to scan QR codes.",
      variant: "destructive",
    });
    setScanning(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <ScanLine className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Scan Attendance QR Code</h2>
        </div>

        {!scanning && !result && (
          <div className="space-y-4">
            <div className="text-center p-12 bg-gradient-subtle rounded-lg border-2 border-dashed border-primary/30">
              <Camera className="h-16 w-16 text-primary mx-auto mb-4" />
              <p className="text-muted-foreground mb-6">
                Position the QR code within the frame to mark your attendance
              </p>
            </div>
            <Button
              onClick={() => setScanning(true)}
              className="w-full hover-lift"
              size="lg"
            >
              <Camera className="h-4 w-4 mr-2" />
              Open Camera
            </Button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {scanning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              <div className="relative rounded-lg overflow-hidden border-4 border-primary">
                <QrReader
                  onResult={(result) => {
                    if (result) {
                      handleScan(result.getText());
                    }
                  }}
                  constraints={{ facingMode: 'environment' }}
                  videoStyle={{ width: '100%' }}
                  containerStyle={{ width: '100%' }}
                  // @ts-ignore
                  onError={handleError}
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 border-2 border-primary/50">
                    <motion.div
                      className="absolute inset-x-0 h-1 bg-primary"
                      animate={{
                        top: ['0%', '100%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                </div>
              </div>

              {processing && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Processing...</p>
                </div>
              )}

              <Button
                onClick={() => setScanning(false)}
                variant="outline"
                className="w-full"
                disabled={processing}
              >
                Cancel
              </Button>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-8 rounded-lg text-center ${
                result.success
                  ? 'bg-green-500/10 border-2 border-green-500/50'
                  : 'bg-red-500/10 border-2 border-red-500/50'
              }`}
            >
              {result.success ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                  >
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-green-700 mb-2">Success!</h3>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                  >
                    <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-red-700 mb-2">Error</h3>
                </>
              )}
              <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                {result.message}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Camera className="h-4 w-4" />
          How to use
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Click "Open Camera" to activate your device camera</li>
          <li>• Point your camera at the QR code displayed by your teacher</li>
          <li>• The code will be scanned automatically</li>
          <li>• Your attendance will be marked instantly</li>
          <li>• You can only mark attendance once per day</li>
        </ul>
      </Card>
    </div>
  );
};