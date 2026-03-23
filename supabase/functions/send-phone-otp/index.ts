import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone || !/^\d{10}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Valid 10-digit phone number required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const AAKASH_SMS_TOKEN = Deno.env.get("AAKASH_SMS_TOKEN");
    if (!AAKASH_SMS_TOKEN) {
      throw new Error("AAKASH_SMS_TOKEN is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Rate limit: max 3 OTPs per phone per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentOtps, error: countError } = await supabase
      .from("phone_otps")
      .select("id")
      .eq("phone", phone)
      .gte("created_at", oneHourAgo);

    if (countError) throw countError;

    if (recentOtps && recentOtps.length >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests. Please try again after some time." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 5-digit OTP
    const otpCode = String(Math.floor(10000 + Math.random() * 90000));

    // Invalidate previous OTPs for this phone
    await supabase
      .from("phone_otps")
      .update({ verified: true })
      .eq("phone", phone)
      .eq("verified", false);

    // Store new OTP
    const { error: insertError } = await supabase.from("phone_otps").insert({
      phone,
      otp_code: otpCode,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    if (insertError) throw insertError;

    // Send OTP via Aakash SMS API
    const smsText = `Your Discoverse Verification OTP: ${otpCode}. Valid for 5 minutes. Do not share this code.`;

    const smsResponse = await fetch("https://sms.aakashsms.com/sms/v3/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: AAKASH_SMS_TOKEN,
        to: phone,
        text: smsText,
      }),
    });

    const smsResult = await smsResponse.json();

    if (smsResult.error) {
      console.error("Aakash SMS error:", smsResult);
      return new Response(
        JSON.stringify({ error: "Failed to send SMS. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-phone-otp error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
