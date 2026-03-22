import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: "Phone and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find matching OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from("phone_otps")
      .select("*")
      .eq("phone", phone)
      .eq("otp_code", otp)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) throw otpError;

    if (!otpRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as verified
    await supabase
      .from("phone_otps")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Derive a stable email from phone number for Supabase auth
    const derivedEmail = `${phone}@phone.discoverse.app`;
    // Deterministic password using phone + server secret
    const encoder = new TextEncoder();
    const keyData = encoder.encode(serviceRoleKey);
    const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(phone));
    const derivedPassword = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === derivedEmail
    );

    let isNewUser = false;

    if (!existingUser) {
      // Create new user
      isNewUser = true;
      const { error: createError } = await supabase.auth.admin.createUser({
        email: derivedEmail,
        password: derivedPassword,
        email_confirm: true,
        user_metadata: { phone, auth_method: "phone" },
      });

      if (createError) {
        console.error("Create user error:", createError);
        throw createError;
      }

      // Update profile with phone
      // Wait a moment for the trigger to create the profile
      await new Promise((r) => setTimeout(r, 500));
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("phone", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // We'll update via the client side after profile completion
    }

    // Sign in - use a regular (anon) client for signInWithPassword
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, anonKey);
    
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: derivedEmail,
      password: derivedPassword,
    });

    if (signInError) {
      console.error("Sign in error:", signInError);
      throw signInError;
    }

    // Update phone on profile
    if (signInData.user) {
      await supabase
        .from("profiles")
        .update({ phone })
        .eq("user_id", signInData.user.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        is_new_user: isNewUser,
        session: {
          access_token: signInData.session?.access_token,
          refresh_token: signInData.session?.refresh_token,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("verify-phone-otp error:", error);
    return new Response(
      JSON.stringify({ error: "Verification failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
