import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Users, Calendar, QrCode, MessageSquare, FileText, BarChart3, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "User Management",
      description: "Seamlessly manage students, teachers, and admin roles with full control",
    },
    {
      icon: QrCode,
      title: "QR Attendance",
      description: "Quick and efficient attendance tracking through QR code scanning",
    },
    {
      icon: Calendar,
      title: "Class Scheduling",
      description: "Organize and view class schedules with an intuitive calendar interface",
    },
    {
      icon: FileText,
      title: "Assignments",
      description: "Upload, manage, and track assignments effortlessly",
    },
    {
      icon: MessageSquare,
      title: "Faculty Chat",
      description: "Direct communication channel between students and teachers",
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Visual insights with heat maps and attendance tracking",
    },
    {
      icon: Shield,
      title: "Secure Access",
      description: "OTP-based authentication ensuring data security and privacy",
    },
    {
      icon: FileText,
      title: "MoU Management",
      description: "Centralized management of Memorandums of Understanding",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gradient">Campus Connect</span>
          </div>
          <Button onClick={() => navigate("/auth")} size="lg" className="hover-lift">
            Login / Sign Up
          </Button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 text-gradient"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Transform Your Campus
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-muted-foreground mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            A comprehensive ERP platform for educational institutes with seamless attendance,
            scheduling, and communication
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Button size="lg" className="hover-lift animate-pulse-glow" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="hover-lift">
              Learn More
            </Button>
          </motion.div>
        </motion.div>

        {/* Floating illustration */}
        <motion.div
          className="mt-20 flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <div className="relative">
            <motion.div
              className="w-full max-w-2xl aspect-video bg-gradient-primary rounded-2xl shadow-glow"
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <GraduationCap className="h-32 w-32 text-primary-foreground opacity-20" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
            Everything You Need
          </h2>
          <p className="text-xl text-muted-foreground">
            Powerful features designed for modern educational institutions
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="p-6 card-hover h-full bg-card/50 backdrop-blur-sm">
                <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Roles Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
            Built for Everyone
          </h2>
          <p className="text-xl text-muted-foreground">
            Tailored experiences for each role in your institution
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              role: "Admin",
              description: "Full system control with user management and comprehensive oversight",
              features: ["Add students & teachers", "Access all data", "Manage MoUs", "System configuration"],
            },
            {
              role: "Teacher",
              description: "Efficient classroom management and student engagement tools",
              features: ["Generate QR codes", "Mark attendance", "Upload assignments", "Schedule classes"],
            },
            {
              role: "Student",
              description: "Stay connected and organized with your academic journey",
              features: ["Scan QR attendance", "View schedule", "Access assignments", "Track performance"],
            },
          ].map((role, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
            >
              <Card className="p-8 card-hover h-full bg-gradient-hero text-primary-foreground">
                <h3 className="text-2xl font-bold mb-3">{role.role}</h3>
                <p className="mb-6 opacity-90">{role.description}</p>
                <ul className="space-y-2">
                  {role.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary-foreground rounded-full" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-primary rounded-3xl p-12 text-center text-primary-foreground shadow-glow"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of institutions transforming their campus management
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="hover-lift"
            onClick={() => navigate("/auth")}
          >
            Start Your Journey
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Campus Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
