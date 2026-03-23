import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { User, ArrowRight, Phone, Calendar, Mail } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type AuthStep = "method" | "phone-input" | "otp-input" | "profile-complete";

export default function Auth() {
  const [step, setStep] = useState<AuthStep>("method");

  // Phone state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // Profile completion state (new phone users)
  const [profileName, setProfileName] = useState("");
  const [profileUsername, setProfileUsername] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileDob, setProfileDob] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://discoverseai.com/",
      },
    });
    if (error) {
      setError(error.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(phone)) {
      setPhoneError("Enter a valid 10-digit phone number");
      return;
    }
    setPhoneLoading(true);
    setPhoneError("");

    try {
      const { data, error } = await supabase.functions.invoke("send-phone-otp", {
        body: { phone },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setStep("otp-input");
    } catch (err: any) {
      setPhoneError(err.message || "Failed to send OTP");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 5) {
      setPhoneError("Enter the 5-digit OTP");
      return;
    }
    setPhoneLoading(true);
    setPhoneError("");

    try {
      const { data, error } = await supabase.functions.invoke("verify-phone-otp", {
        body: { phone, otp },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (data.is_new_user) {
          setStep("profile-complete");
        }
        // If not new, auth state change will redirect
      }
    } catch (err: any) {
      setPhoneError(err.message || "Invalid OTP");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleProfileComplete = async () => {
    if (!profileName.trim()) {
      setPhoneError("Name is required");
      return;
    }
    setPhoneLoading(true);
    setPhoneError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updates: Record<string, any> = {
        display_name: profileName.trim(),
        phone,
      };
      if (profileUsername.trim()) updates.username = profileUsername.trim();
      if (profileDob) updates.date_of_birth = profileDob;

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;

      // Optionally update email in user metadata
      if (profileEmail.trim()) {
        await supabase.auth.updateUser({
          data: { contact_email: profileEmail.trim(), full_name: profileName.trim() },
        });
      }

      // Redirect will happen via auth state
      window.location.href = "/app";
    } catch (err: any) {
      setPhoneError(err.message || "Failed to save profile");
    } finally {
      setPhoneLoading(false);
    }
  };

  const renderPhoneFlow = () => {
    if (step === "otp-input") {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter the 5-digit code sent to <span className="font-medium text-foreground">{phone}</span>
          </p>
          <div className="flex justify-center">
            <InputOTP maxLength={5} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
          <button
            onClick={handleVerifyOtp}
            disabled={phoneLoading || otp.length !== 5}
            className="w-full h-11 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.97] disabled:opacity-50"
          >
            {phoneLoading ? "Verifying..." : "Verify OTP"}
          </button>
          <button
            onClick={() => { setStep("phone-input"); setOtp(""); setPhoneError(""); }}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Change number or resend
          </button>
        </div>
      );
    }

    if (step === "profile-complete") {
      return (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Complete your profile</h3>
          <p className="text-sm text-muted-foreground">Tell us a bit about yourself</p>

          <div className="relative">
            <User size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Full name *"
              className="w-full h-11 bg-card border border-border rounded-lg pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors" />
          </div>

          <div className="relative">
            <User size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={profileUsername} onChange={(e) => setProfileUsername(e.target.value)} placeholder="Username (optional)"
              className="w-full h-11 bg-card border border-border rounded-lg pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors" />
          </div>

          <div className="relative">
            <Mail size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} placeholder="Email (optional)"
              className="w-full h-11 bg-card border border-border rounded-lg pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors" />
          </div>

          <div className="relative">
            <Calendar size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="date" value={profileDob} onChange={(e) => setProfileDob(e.target.value)} placeholder="Date of birth"
              className="w-full h-11 bg-card border border-border rounded-lg pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors" />
          </div>

          {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}

          <button
            onClick={handleProfileComplete}
            disabled={phoneLoading || !profileName.trim()}
            className="w-full h-11 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.97] disabled:opacity-50"
          >
            {phoneLoading ? "Saving..." : "Get Started"}
          </button>
        </div>
      );
    }

    // Phone input step
    return (
      <div className="space-y-3">
        <div className="relative">
          <Phone size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit phone number"
            className="w-full h-11 bg-card border border-border rounded-lg pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
        <button
          onClick={handleSendOtp}
          disabled={phoneLoading || phone.length !== 10}
          className="w-full h-11 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.97] disabled:opacity-50"
        >
          {phoneLoading ? "Sending OTP..." : "Send OTP"}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary items-center justify-center p-16">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <Logo size={40} />
            <span className="text-2xl font-semibold text-foreground">Discoverse</span>
          </div>
          <h1 className="text-3xl font-semibold text-foreground leading-tight mb-4">
            Explore any topic in interactive 3D
          </h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            AI-powered 3D learning with specialized agents, step-by-step simulations, and natural voice narration.
          </p>
          <div className="mt-12 space-y-4">
            {["Creator-built specialized AI agents", "Interactive 3D simulations", "Voice narration in Hindi & English"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <ArrowRight size={12} strokeWidth={2} className="text-accent" />
                </div>
                <span className="text-sm text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Logo size={28} />
            <span className="text-lg font-semibold text-foreground">Discoverse</span>
          </div>

          {step === "profile-complete" ? (
            renderPhoneFlow()
          ) : (
            <>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                Welcome to Discoverse
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Sign in to start exploring 3D learning
              </p>

              {/* Google Sign In */}
              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 h-11 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors duration-150 disabled:opacity-50 mb-4"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {loading ? "Please wait..." : "Continue with Google"}
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Phone OTP */}
              {renderPhoneFlow()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
