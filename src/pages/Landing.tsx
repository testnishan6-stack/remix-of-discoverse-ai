import { useEffect, useRef, useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowRight, Sparkles, Bot, BookOpen, Zap, Brain, Globe,
  ChevronRight, Users, TrendingUp, Award, Check, X, Mail,
  Shield, Handshake, FileText, MessageSquare, Menu, ExternalLink,
  Star, Rocket, Eye, Play, Cpu, Lock, Crown, Phone, DollarSign,
  Briefcase, Scale, AlertTriangle, UserPlus, Heart, Send,
} from "lucide-react";

/* ── Reveal hook ── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={className}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)", filter: visible ? "blur(0)" : "blur(6px)", transition: `all 800ms cubic-bezier(0.16,1,0.3,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

function Counter({ target, suffix = "+", duration = 2200 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useInView(0.3);
  useEffect(() => {
    if (!visible) return;
    const start = Date.now();
    const tick = () => { const p = Math.min((Date.now() - start) / duration, 1); setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target)); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, [visible, target, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function GlowOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return <div className={`absolute rounded-full pointer-events-none ${className}`} style={{ animation: `float-y 8s ease-in-out infinite ${delay}s, pulse-glow-orb 4s ease-in-out infinite ${delay + 1}s` }} />;
}

/* ── Animated 3D Heart ── */
function HeartModel() {
  const ref = useRef<any>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.3;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    // Heartbeat scale
    const beat = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.02;
    ref.current.scale.set(beat * 1.8, beat * 1.8, beat * 1.8);
  });
  
  return (
    <group ref={ref}>
      {/* Stylized heart using basic shapes */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#CC4444" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[-0.35, 0.25, 0]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color="#DD5555" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0.35, 0.25, 0]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color="#DD5555" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Arteries */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.4, 12]} />
        <meshStandardMaterial color="#993333" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[-0.15, 0.6, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.05, 0.08, 0.3, 12]} />
        <meshStandardMaterial color="#AA4444" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0.15, 0.6, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.05, 0.08, 0.3, 12]} />
        <meshStandardMaterial color="#AA4444" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.01, 16, 64]} />
        <meshBasicMaterial color="#ff6b6b" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function Heart3DViewer() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
        <directionalLight position={[-3, -3, -3]} intensity={0.3} color="#ff8888" />
        <pointLight position={[0, 0, 3]} intensity={0.5} color="#ff4444" />
        <Suspense fallback={null}>
          <HeartModel />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} enablePan={false} />
      </Canvas>
    </div>
  );
}

/* ── Form Modal ── */
function FormModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-border transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/* ── Data ── */
const AGENTS = [
  { name: "Saathi", role: "Science Guide", emoji: "🔬", color: "hsl(17,62%,60%)", users: "1.2k" },
  { name: "Thumbnail Pro", role: "YouTube Designer", emoji: "🎨", color: "hsl(262,52%,55%)", users: "890" },
  { name: "Research Buddy", role: "Paper Analyst", emoji: "📚", color: "hsl(200,62%,50%)", users: "2.1k" },
  { name: "Code Sensei", role: "Dev Helper", emoji: "💻", color: "hsl(150,52%,45%)", users: "1.8k" },
  { name: "PDF Master", role: "Document AI", emoji: "📄", color: "hsl(340,52%,55%)", users: "670" },
  { name: "Slide Pro", role: "PPTX Creator", emoji: "📊", color: "hsl(45,72%,50%)", users: "540" },
];

const COMPARE = [
  { feature: "Specialized AI Agents", us: true, them: false },
  { feature: "Creator-built personalities", us: true, them: false },
  { feature: "3D interactive simulations", us: true, them: false },
  { feature: "Voice narration (Hindi/EN)", us: true, them: false },
  { feature: "Step-by-step learning", us: true, them: false },
  { feature: "Agent marketplace", us: true, them: false },
  { feature: "Generic chat responses", us: false, them: true },
  { feature: "Text-only output", us: false, them: true },
];

const STATS = [
  { label: "Active Learners", target: 2847, icon: Users },
  { label: "Simulations Run", target: 14523, icon: TrendingUp },
  { label: "AI Agents", target: 36, icon: Award },
  { label: "Countries", target: 12, icon: Globe },
];

const FEATURES = [
  { icon: Bot, title: "Creator-Built AI Agents", desc: "Not generic chatbots — real personalities with deep knowledge, built by creators who care.", gradient: "from-accent/20 to-accent/5" },
  { icon: BookOpen, title: "3D Simulations", desc: "Real 3D models with step-by-step AI narration. Understand in seconds, not hours.", gradient: "from-blue-500/20 to-blue-500/5" },
  { icon: Brain, title: "Personalized Learning", desc: "Every agent has unique personality, knowledge base & voice. Like having your own tutor.", gradient: "from-purple-500/20 to-purple-500/5" },
  { icon: Zap, title: "Point-to-Point", desc: "No fluff. Direct explanations that make you go 'ohh, that's how it works!'", gradient: "from-yellow-500/20 to-yellow-500/5" },
  { icon: Lock, title: "Privacy First", desc: "Your conversations stay private. No data selling. No tracking.", gradient: "from-green-500/20 to-green-500/5" },
  { icon: Crown, title: "Creator Economy", desc: "Build agents, grow audience, earn recognition. The AI creator economy starts here.", gradient: "from-pink-500/20 to-pink-500/5" },
];

const TESTIMONIALS = [
  { name: "Aarav S.", role: "Student, Nepal", text: "Discoverse agents explain physics like my best friend would. Finally understanding quantum mechanics!", avatar: "A" },
  { name: "Priya M.", role: "Creator", text: "Built my own Biology agent in 10 minutes. Already has 200+ users chatting with it daily.", avatar: "P" },
  { name: "Rahul K.", role: "Teacher", text: "The 3D simulations are game-changing. My students actually want to study now.", avatar: "R" },
];

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Agents", href: "#agents" },
  { label: "3D Demo", href: "#3d-demo" },
  { label: "Licenses", href: "#licenses" },
  { label: "Contact", href: "#contact" },
];

const LICENSE_TIERS = [
  { name: "Free", price: "Free", features: ["View public 3D models", "Basic AI interactions", "Community access", "5 generations/week"], cta: "Get Started", highlight: false },
  { name: "Pro", price: "$9/mo", features: ["Unlimited AI interactions", "All 3D models", "Priority support", "Create AI agents", "Voice narration", "Export simulations"], cta: "Upgrade to Pro", highlight: true },
  { name: "Enterprise", price: "Custom", features: ["Everything in Pro", "Custom model uploads", "API access", "Dedicated support", "White-label option", "SLA guarantee"], cta: "Contact Sales", highlight: false },
];

export default function Landing() {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Modal states
  const [showContact, setShowContact] = useState(false);
  const [showAffiliate, setShowAffiliate] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [showInvest, setShowInvest] = useState(false);
  const [showContentPolicy, setShowContentPolicy] = useState(false);

  // Form states
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [affiliateForm, setAffiliateForm] = useState({ name: "", email: "", website: "", audience: "" });
  const [joinTeamForm, setJoinTeamForm] = useState({ name: "", email: "", role: "", portfolio: "", why: "" });
  const [investForm, setInvestForm] = useState({ name: "", email: "", company: "", amount: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setHeroVisible(true)); }, []);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const onMove = (e: MouseEvent) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const scrollTo = (id: string) => { setMobileMenu(false); document.querySelector(id)?.scrollIntoView({ behavior: "smooth" }); };

  const submitContact = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) { toast.error("Please fill all fields"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("contact_submissions").insert({ name: contactForm.name, email: contactForm.email, message: contactForm.message, subject: "general" });
    setSubmitting(false);
    if (error) { toast.error("Failed to submit. Try emailing discoversesupport@gmail.com"); return; }
    toast.success("Message sent! We'll get back to you soon.");
    setContactForm({ name: "", email: "", message: "" });
    setShowContact(false);
  };

  const submitAffiliate = async () => {
    if (!affiliateForm.name || !affiliateForm.email) { toast.error("Please fill required fields"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("contact_submissions").insert({ name: affiliateForm.name, email: affiliateForm.email, message: `Affiliate Application\nWebsite: ${affiliateForm.website}\nAudience: ${affiliateForm.audience}`, subject: "affiliate" });
    setSubmitting(false);
    if (error) { toast.error("Failed to submit"); return; }
    toast.success("Affiliate application received! We'll review and get back to you.");
    setAffiliateForm({ name: "", email: "", website: "", audience: "" });
    setShowAffiliate(false);
  };

  const submitJoinTeam = async () => {
    if (!joinTeamForm.name || !joinTeamForm.email || !joinTeamForm.role) { toast.error("Please fill required fields"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("contact_submissions").insert({ name: joinTeamForm.name, email: joinTeamForm.email, message: `Join Team Application\nRole: ${joinTeamForm.role}\nPortfolio: ${joinTeamForm.portfolio}\nWhy: ${joinTeamForm.why}`, subject: "join_team" });
    setSubmitting(false);
    if (error) { toast.error("Failed to submit"); return; }
    toast.success("Application submitted! We'll reach out soon.");
    setJoinTeamForm({ name: "", email: "", role: "", portfolio: "", why: "" });
    setShowJoinTeam(false);
  };

  const submitInvest = async () => {
    if (!investForm.name || !investForm.email) { toast.error("Please fill required fields"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("contact_submissions").insert({ name: investForm.name, email: investForm.email, message: `Investment Inquiry\nCompany: ${investForm.company}\nAmount: ${investForm.amount}\nMessage: ${investForm.message}`, subject: "investment" });
    setSubmitting(false);
    if (error) { toast.error("Failed to submit. Email discoverseai@gmail.com directly"); return; }
    toast.success("Investment inquiry received! Our team will contact you shortly.");
    setInvestForm({ name: "", email: "", company: "", amount: "", message: "" });
    setShowInvest(false);
  };

  const inputClass = "w-full bg-background border border-border rounded-xl h-11 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all";
  const textareaClass = "w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none";
  const submitBtnClass = "w-full bg-accent text-accent-foreground h-12 rounded-xl text-sm font-bold hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/20";

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <style>{`
        @keyframes float-y { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes rotate-slow { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 hsla(17,62%,60%,0.3)} 50%{box-shadow:0 0 0 14px hsla(17,62%,60%,0)} }
        @keyframes pulse-glow-orb { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes float-card { 0%,100%{transform:translateY(0) rotate(0deg)} 25%{transform:translateY(-8px) rotate(1deg)} 75%{transform:translateY(4px) rotate(-1deg)} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes heartbeat { 0%,100%{transform:scale(1)} 14%{transform:scale(1.1)} 28%{transform:scale(1)} 42%{transform:scale(1.1)} 70%{transform:scale(1)} }
        .gradient-text { background: linear-gradient(135deg, hsl(17,62%,60%), hsl(262,52%,55%), hsl(200,62%,50%)); background-size: 200% 200%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: gradient-shift 4s ease infinite; }
        .glass-card { background: hsla(0,0%,100%,0.7); backdrop-filter: blur(20px); border: 1px solid hsla(30,18%,88%,0.5); }
        .hover-lift { transition: all 400ms cubic-bezier(0.16,1,0.3,1); }
        .hover-lift:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 40px -12px hsla(17,62%,60%,0.15); }
      `}</style>

      {/* ═══ NAV ═══ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50 ? "bg-background/90 backdrop-blur-2xl shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-5">
          <div className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="text-[17px] font-bold text-foreground tracking-tight">Discoverse</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.href)} className="text-[13px] text-muted-foreground hover:text-accent transition-colors font-medium relative group">
                {l.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent rounded-full transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/auth")} className="hidden sm:block text-[13px] text-muted-foreground hover:text-foreground transition-colors font-medium">Sign in</button>
            <button onClick={() => navigate("/auth")} className="bg-accent text-accent-foreground text-[13px] font-bold px-5 py-2.5 rounded-xl hover:opacity-90 active:scale-[0.97] transition-all shadow-lg shadow-accent/15">
              Get Started
            </button>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-1"><Menu size={22} className="text-foreground" /></button>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden glass-card mx-3 mb-2 rounded-2xl px-5 py-3 space-y-2 animate-fade-in">
            {NAV_LINKS.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.href)} className="block w-full text-left text-sm text-muted-foreground py-2 hover:text-accent">{l.label}</button>
            ))}
            <button onClick={() => { setMobileMenu(false); navigate("/auth"); }} className="block w-full text-left text-sm text-accent font-bold py-2">Sign in →</button>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="pt-28 pb-20 px-5 relative overflow-hidden min-h-[90vh] flex items-center">
        <GlowOrb className="top-16 left-8 w-72 h-72 bg-accent/8 blur-[80px]" />
        <GlowOrb className="top-32 right-12 w-96 h-96 bg-purple-500/5 blur-[100px]" delay={2} />
        <GlowOrb className="bottom-20 left-1/3 w-64 h-64 bg-blue-500/5 blur-[80px]" delay={4} />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px", transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -10}px)`,
        }} />

        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-1.5 mb-6" style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(16px)", transition: "all 600ms cubic-bezier(0.16,1,0.3,1) 100ms" }}>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[12px] font-semibold text-accent">2,847 learners online now</span>
            </div>
            <h1 className="text-[clamp(2.4rem,7vw,4.2rem)] font-black text-foreground leading-[1.05] tracking-tight mb-5" style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)", transition: "all 800ms cubic-bezier(0.16,1,0.3,1) 200ms" }}>
              The Future of<br /><span className="gradient-text">AI Learning</span> is Here.
            </h1>
            <p className="text-[clamp(0.95rem,2.2vw,1.15rem)] text-muted-foreground leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8" style={{ opacity: heroVisible ? 1 : 0, transition: "all 700ms cubic-bezier(0.16,1,0.3,1) 400ms" }}>
              Creator-built AI agents with real personalities. 3D simulations with voice narration. <span className="text-foreground font-semibold">Understand anything in seconds</span> — not hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3" style={{ opacity: heroVisible ? 1 : 0, transition: "all 700ms cubic-bezier(0.16,1,0.3,1) 550ms" }}>
              <button onClick={() => navigate("/auth")} className="w-full sm:w-auto bg-accent text-accent-foreground text-[15px] font-bold px-8 py-4 rounded-2xl hover:opacity-90 active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-xl shadow-accent/25" style={{ animation: "pulse-glow 3s ease-in-out infinite" }}>
                Start Learning Free <ArrowRight size={18} />
              </button>
              <button onClick={() => scrollTo("#3d-demo")} className="w-full sm:w-auto glass-card text-[14px] font-semibold text-foreground px-7 py-4 rounded-2xl hover:bg-card active:scale-[0.97] transition-all">
                <span className="flex items-center justify-center gap-2"><Play size={14} className="text-accent" /> Live 3D Demo</span>
              </button>
            </div>
            <div className="mt-10 flex items-center gap-4 justify-center lg:justify-start" style={{ opacity: heroVisible ? 1 : 0, transition: "all 700ms cubic-bezier(0.16,1,0.3,1) 750ms" }}>
              <div className="flex -space-x-2.5">
                {["R","A","S","M","K"].map((l, i) => (
                  <div key={l} className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-[11px] font-bold text-white shadow-md" style={{ backgroundColor: ["hsl(17,62%,60%)","hsl(262,52%,55%)","hsl(200,62%,50%)","hsl(150,52%,45%)","hsl(340,52%,55%)"][i] }}>{l}</div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={12} fill="hsl(45,92%,55%)" className="text-yellow-400" />)}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5"><span className="text-foreground font-semibold">4.9/5</span> from 2,847 learners</p>
              </div>
            </div>
          </div>

          {/* 3D Heart Viewer - Hero */}
          <div className="hidden lg:block" style={{ opacity: heroVisible ? 1 : 0, transition: "all 1000ms cubic-bezier(0.16,1,0.3,1) 600ms" }}>
            <div className="relative">
              <div className="w-full aspect-square max-w-[440px] mx-auto rounded-3xl overflow-hidden glass-card shadow-2xl">
                <Heart3DViewer />
                <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-sm rounded-xl px-4 py-3 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart size={14} className="text-red-500" style={{ animation: "heartbeat 1.5s ease-in-out infinite" }} />
                    <p className="text-xs font-bold text-foreground">Human Heart — Live Demo</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Interactive 3D · AI Narrated · Rotate & Explore</p>
                  <div className="flex gap-0.5 mt-2">{[1,2,3,4,5,6].map(i => <div key={i} className="flex-1 h-1 rounded-full" style={{ backgroundColor: i <= 3 ? "hsl(var(--accent))" : "hsl(var(--border))" }} />)}</div>
                </div>
              </div>
              <div className="absolute -inset-4 rounded-3xl border border-accent/10 pointer-events-none" style={{ animation: "pulse-glow 3s ease-in-out infinite" }} />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile 3D Heart */}
      <section className="lg:hidden px-5 pb-10">
        <div className="w-full aspect-[4/3] max-w-sm mx-auto rounded-3xl overflow-hidden glass-card shadow-xl">
          <Heart3DViewer />
          <div className="absolute bottom-3 left-3 right-3 bg-card/95 backdrop-blur-sm rounded-xl px-3 py-2 border border-border">
            <div className="flex items-center gap-2">
              <Heart size={12} className="text-red-500" style={{ animation: "heartbeat 1.5s ease-in-out infinite" }} />
              <p className="text-[11px] font-bold text-foreground">Human Heart — Live</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SCROLLING BRANDS ═══ */}
      <section className="py-6 border-y border-border overflow-hidden">
        <div className="flex items-center" style={{ animation: "marquee 20s linear infinite" }}>
          {["🔬 Science","📐 Mathematics","💻 Coding","🧬 Biology","⚛️ Physics","🌍 Geography","📊 Data Science","🎨 Design","🔬 Science","📐 Mathematics","💻 Coding","🧬 Biology","⚛️ Physics","🌍 Geography","📊 Data Science","🎨 Design"].map((item, i) => (
            <span key={i} className="text-[13px] text-muted-foreground font-medium whitespace-nowrap mx-8">{item}</span>
          ))}
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-14 px-5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 100}>
              <div className="glass-card rounded-2xl p-5 text-center hover-lift cursor-default">
                <div className="w-10 h-10 rounded-xl bg-accent/8 flex items-center justify-center mx-auto mb-3">
                  <stat.icon size={20} strokeWidth={1.5} className="text-accent" />
                </div>
                <p className="text-[clamp(1.4rem,3.5vw,2rem)] font-black text-foreground tabular-nums"><Counter target={stat.target} /></p>
                <p className="text-[11px] text-muted-foreground mt-1 font-semibold uppercase tracking-wider">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ AGENTS ═══ */}
      <section id="agents" className="py-16 px-5">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent/8 border border-accent/15 rounded-full px-4 py-1.5 mb-4">
              <Bot size={13} className="text-accent" />
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider">Agent Marketplace</span>
            </div>
            <h2 className="text-[clamp(1.5rem,4.5vw,2.4rem)] font-black text-foreground">Specialized AI, not generic chatbots</h2>
            <p className="text-[14px] text-muted-foreground mt-3 max-w-md mx-auto">Every agent is built by a creator with real expertise.</p>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AGENTS.map((agent, i) => (
              <Reveal key={agent.name} delay={i * 80}>
                <div className="glass-card rounded-2xl p-4 hover-lift cursor-pointer group relative overflow-hidden" onClick={() => navigate("/auth")}>
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ backgroundColor: agent.color }} />
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 relative" style={{ backgroundColor: `${agent.color}15` }}>{agent.emoji}</div>
                  <h3 className="text-[14px] font-bold text-foreground">{agent.name}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{agent.role}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Users size={10} /> {agent.users} users</span>
                    <span className="text-[11px] text-accent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-0.5 font-bold">Chat <ChevronRight size={12} /></span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 3D DEMO ═══ */}
      <section id="3d-demo" className="py-20 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/3 to-background" />
        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-red-500/8 border border-red-500/15 rounded-full px-4 py-1.5 mb-4">
              <Heart size={13} className="text-red-500" />
              <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider">Live 3D Experience</span>
            </div>
            <h2 className="text-[clamp(1.5rem,4.5vw,2.4rem)] font-black text-foreground">Interactive 3D Heart Simulation</h2>
            <p className="text-[14px] text-muted-foreground mt-3 max-w-lg mx-auto">Rotate, zoom, explore — this is how learning should feel. Real 3D models with AI-powered step-by-step narration.</p>
          </Reveal>
          <Reveal>
            <div className="max-w-2xl mx-auto">
              <div className="aspect-square rounded-3xl overflow-hidden glass-card shadow-2xl relative">
                <Heart3DViewer />
                <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-foreground">Live</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-sm rounded-xl p-4 border border-border">
                  <h3 className="text-sm font-bold text-foreground mb-1">🫀 Human Heart — Anatomical Model</h3>
                  <p className="text-xs text-muted-foreground mb-3">Drag to rotate · Pinch to zoom · AI narrates each part</p>
                  <button onClick={() => navigate("/auth")} className="w-full bg-accent text-accent-foreground py-2.5 rounded-xl text-xs font-bold hover:opacity-90 active:scale-[0.97] transition-all flex items-center justify-center gap-2">
                    <Play size={12} /> Start Learning This →
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-16 px-5 relative">
        <GlowOrb className="top-0 right-1/4 w-80 h-80 bg-purple-500/5 blur-[100px]" delay={1} />
        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent/8 border border-accent/15 rounded-full px-4 py-1.5 mb-4">
              <Zap size={13} className="text-accent" />
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider">Why Discoverse</span>
            </div>
            <h2 className="text-[clamp(1.5rem,4.5vw,2.4rem)] font-black text-foreground">Built for instant understanding</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 100}>
                <div className="glass-card rounded-2xl p-6 hover-lift group relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-xl bg-accent/8 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <f.icon size={22} strokeWidth={1.5} className="text-accent" />
                    </div>
                    <h3 className="text-[15px] font-bold text-foreground mb-2">{f.title}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPARE ═══ */}
      <section id="compare" className="py-16 px-5">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-10">
            <h2 className="text-[clamp(1.5rem,4.5vw,2.4rem)] font-black text-foreground">Discoverse vs Generic AI</h2>
            <p className="text-[14px] text-muted-foreground mt-2">We're built for <span className="gradient-text font-bold">understanding</span>, not just text output.</p>
          </Reveal>
          <Reveal>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 border-b border-border bg-accent/5">
                <div className="p-4 text-[12px] font-bold text-muted-foreground">Feature</div>
                <div className="p-4 text-center"><div className="inline-flex items-center gap-1.5"><Logo size={16} /><span className="text-[12px] font-black text-accent">Discoverse</span></div></div>
                <div className="p-4 text-center text-[12px] font-bold text-muted-foreground">Others</div>
              </div>
              {COMPARE.map((row, i) => (
                <div key={row.feature} className={`grid grid-cols-3 ${i < COMPARE.length - 1 ? "border-b border-border" : ""} hover:bg-accent/3 transition-colors`}>
                  <div className="p-3 md:p-4 text-[12px] md:text-[13px] text-foreground flex items-center font-medium">{row.feature}</div>
                  <div className="p-3 md:p-4 flex items-center justify-center">
                    {row.us ? <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center"><Check size={14} className="text-accent" strokeWidth={2.5} /></div>
                    : <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center"><X size={14} className="text-muted-foreground" /></div>}
                  </div>
                  <div className="p-3 md:p-4 flex items-center justify-center">
                    {row.them ? <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center"><Check size={14} className="text-muted-foreground" /></div>
                    : <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center"><X size={14} className="text-muted-foreground" /></div>}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ LICENSES / PRICING ═══ */}
      <section id="licenses" className="py-20 px-5 relative">
        <GlowOrb className="top-1/2 left-1/4 w-64 h-64 bg-accent/5 blur-[80px]" delay={2} />
        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent/8 border border-accent/15 rounded-full px-4 py-1.5 mb-4">
              <Scale size={13} className="text-accent" />
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider">3D Model Licenses</span>
            </div>
            <h2 className="text-[clamp(1.5rem,4.5vw,2.4rem)] font-black text-foreground">Choose your plan</h2>
            <p className="text-[14px] text-muted-foreground mt-3 max-w-md mx-auto">Access thousands of interactive 3D models with AI-powered learning.</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LICENSE_TIERS.map((tier, i) => (
              <Reveal key={tier.name} delay={i * 100}>
                <div className={`rounded-3xl p-6 transition-all duration-300 relative overflow-hidden ${tier.highlight ? "bg-accent text-accent-foreground shadow-2xl shadow-accent/25 scale-[1.02]" : "glass-card hover-lift"}`}>
                  {tier.highlight && <div className="absolute top-0 left-0 right-0 h-1 bg-white/30" />}
                  {tier.highlight && <span className="absolute top-3 right-3 text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase">Popular</span>}
                  <h3 className={`text-lg font-black ${tier.highlight ? "" : "text-foreground"}`}>{tier.name}</h3>
                  <p className={`text-3xl font-black mt-2 mb-4 ${tier.highlight ? "" : "text-foreground"}`}>{tier.price}</p>
                  <ul className="space-y-2.5 mb-6">
                    {tier.features.map(f => (
                      <li key={f} className={`flex items-center gap-2 text-[13px] ${tier.highlight ? "text-white/90" : "text-muted-foreground"}`}>
                        <Check size={14} className={tier.highlight ? "text-white" : "text-accent"} /> {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => tier.name === "Enterprise" ? setShowContact(true) : navigate("/auth")}
                    className={`w-full py-3 rounded-xl text-sm font-bold active:scale-[0.97] transition-all ${tier.highlight ? "bg-white text-accent hover:bg-white/90" : "bg-accent text-accent-foreground hover:opacity-90"}`}>
                    {tier.cta}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-16 px-5 relative">
        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal className="text-center mb-10">
            <h2 className="text-[clamp(1.5rem,4.5vw,2.4rem)] font-black text-foreground">What our community says</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 120}>
                <div className="glass-card rounded-2xl p-5 hover-lift">
                  <div className="flex items-center gap-0.5 mb-3">{[1,2,3,4,5].map(s => <Star key={s} size={12} fill="hsl(45,92%,55%)" className="text-yellow-400" />)}</div>
                  <p className="text-[13px] text-foreground leading-relaxed mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-[12px] font-bold text-accent">{t.avatar}</div>
                    <div>
                      <p className="text-[12px] font-bold text-foreground">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PARTNER / INVEST / JOIN SECTION ═══ */}
      <section className="py-16 px-5">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="text-[clamp(1.5rem,4.5vw,2.4rem)] font-black text-foreground">Work With Us</h2>
            <p className="text-[14px] text-muted-foreground mt-2">Join the Discoverse ecosystem as a partner, investor, or team member.</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Handshake, title: "Partner With Us", desc: "Collaborate on 3D content, distribution, or tech integration.", action: () => window.open("mailto:discoversepartner@gmail.com?subject=Partnership Inquiry"), color: "hsl(200,62%,50%)" },
              { icon: UserPlus, title: "Become Affiliate", desc: "Earn commissions by promoting Discoverse to your audience.", action: () => setShowAffiliate(true), color: "hsl(150,52%,45%)" },
              { icon: DollarSign, title: "Invest in Discoverse", desc: "Be part of the next big thing in AI-powered education.", action: () => setShowInvest(true), color: "hsl(45,72%,50%)" },
              { icon: Briefcase, title: "Join the Team", desc: "We're hiring passionate builders to shape the future.", action: () => setShowJoinTeam(true), color: "hsl(262,52%,55%)" },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 100}>
                <div className="glass-card rounded-2xl p-6 hover-lift cursor-pointer group" onClick={item.action}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${item.color}15` }}>
                    <item.icon size={22} style={{ color: item.color }} />
                  </div>
                  <h3 className="text-[15px] font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{item.desc}</p>
                  <span className="text-accent text-[12px] font-bold mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    Learn more <ChevronRight size={12} />
                  </span>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Direct contact for partners */}
          <Reveal className="mt-8">
            <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Direct Partnership Contact</h3>
                <p className="text-sm text-muted-foreground mt-1">Reach us directly for partnership opportunities</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <a href="mailto:discoversepartner@gmail.com" className="flex items-center gap-2 bg-secondary px-4 py-2.5 rounded-xl text-sm text-foreground font-medium hover:bg-border transition-colors">
                  <Mail size={14} className="text-accent" /> discoversepartner@gmail.com
                </a>
                <a href="tel:9767656110" className="flex items-center gap-2 bg-secondary px-4 py-2.5 rounded-xl text-sm text-foreground font-medium hover:bg-border transition-colors">
                  <Phone size={14} className="text-accent" /> 9767656110
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ CONTENT POLICY ═══ */}
      <section className="py-12 px-5">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} className="text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-foreground mb-1">Content & Licensing Policy</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
                  All 3D models on Discoverse are either original creations, Creative Commons licensed, or used with explicit permission. We have a zero-tolerance policy for inappropriate content. AI agents must comply with our community guidelines.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setShowContentPolicy(true)} className="text-[12px] text-accent font-bold hover:underline">View Full Policy</button>
                  <span className="text-muted-foreground">·</span>
                  <button onClick={() => navigate("/terms")} className="text-[12px] text-accent font-bold hover:underline">Terms of Service</button>
                  <span className="text-muted-foreground">·</span>
                  <a href="mailto:discoversesupport@gmail.com?subject=Content Report" className="text-[12px] text-destructive font-bold hover:underline">Report Content</a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 px-5 relative">
        <GlowOrb className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/8 blur-[120px]" />
        <Reveal className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-[clamp(1.8rem,6vw,2.8rem)] font-black text-foreground mb-4 leading-tight">
            Ready to learn <span className="gradient-text">differently?</span>
          </h2>
          <p className="text-[15px] text-muted-foreground mb-8 leading-relaxed">Join thousands using specialized AI agents to understand complex topics instantly.</p>
          <button onClick={() => navigate("/auth")} className="bg-accent text-accent-foreground text-[15px] font-bold px-10 py-4 rounded-2xl hover:opacity-90 active:scale-[0.97] transition-all shadow-xl shadow-accent/25" style={{ animation: "pulse-glow 3s ease-in-out infinite" }}>
            Get Started Free
          </button>
        </Reveal>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer id="contact" className="border-t border-border bg-secondary/30">
        <div className="max-w-6xl mx-auto px-5 py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-3"><Logo size={24} /><span className="text-[15px] font-black text-foreground">Discoverse</span></div>
              <p className="text-[12px] text-muted-foreground leading-relaxed mb-4">AI-powered learning platform with specialized agents and 3D simulations.</p>
            </div>
            <div>
              <p className="text-[11px] font-black text-foreground uppercase tracking-wider mb-3">Product</p>
              <div className="space-y-2">
                {["AI Agents","3D Simulations","Learn Mode","Create Agent"].map(l => (
                  <button key={l} onClick={() => navigate("/auth")} className="block text-[13px] text-muted-foreground hover:text-accent transition-colors">{l}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-black text-foreground uppercase tracking-wider mb-3">Company</p>
              <div className="space-y-2">
                <button onClick={() => setShowContact(true)} className="block text-[13px] text-muted-foreground hover:text-accent transition-colors">Contact Us</button>
                <button onClick={() => setShowAffiliate(true)} className="block text-[13px] text-muted-foreground hover:text-accent transition-colors">Become Affiliate</button>
                <a href="mailto:discoversepartner@gmail.com" className="block text-[13px] text-muted-foreground hover:text-accent transition-colors">Partner With Us</a>
                <button onClick={() => setShowInvest(true)} className="block text-[13px] text-muted-foreground hover:text-accent transition-colors">Invest</button>
                <button onClick={() => setShowJoinTeam(true)} className="block text-[13px] text-muted-foreground hover:text-accent transition-colors">Join Team</button>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-black text-foreground uppercase tracking-wider mb-3">Legal & Support</p>
              <div className="space-y-2">
                <button onClick={() => navigate("/privacy")} className="block text-[13px] text-muted-foreground hover:text-accent transition-colors">Privacy Policy</button>
                <button onClick={() => navigate("/terms")} className="block text-[13px] text-muted-foreground hover:text-accent transition-colors">Terms of Service</button>
                <button onClick={() => setShowContentPolicy(true)} className="block text-[13px] text-muted-foreground hover:text-accent transition-colors">Content Policy</button>
                <a href="mailto:discoversesupport@gmail.com" className="block text-[13px] text-muted-foreground hover:text-accent transition-colors">Support</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-muted-foreground">© 2025 Discoverse AI. All rights reserved.</p>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span>Support: discoversesupport@gmail.com</span>
              <span>Payment: discoversepayment@gmail.com</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ MODALS ═══ */}

      {/* Contact Us */}
      {showContact && (
        <FormModal title="Contact Us" onClose={() => setShowContact(false)}>
          <p className="text-sm text-muted-foreground mb-4">Have questions? Reach us directly or fill this form.</p>
          <div className="space-y-3">
            <input className={inputClass} placeholder="Your name" value={contactForm.name} onChange={(e) => setContactForm({...contactForm, name: e.target.value})} />
            <input className={inputClass} placeholder="Email address" type="email" value={contactForm.email} onChange={(e) => setContactForm({...contactForm, email: e.target.value})} />
            <textarea className={textareaClass} rows={4} placeholder="Your message..." value={contactForm.message} onChange={(e) => setContactForm({...contactForm, message: e.target.value})} />
            <button onClick={submitContact} disabled={submitting} className={submitBtnClass}>
              <Send size={14} /> {submitting ? "Sending..." : "Send Message"}
            </button>
            <p className="text-[11px] text-muted-foreground text-center">Or email us at discoversesupport@gmail.com</p>
          </div>
        </FormModal>
      )}

      {/* Affiliate */}
      {showAffiliate && (
        <FormModal title="Become an Affiliate" onClose={() => setShowAffiliate(false)}>
          <p className="text-sm text-muted-foreground mb-4">Earn commissions by promoting Discoverse to your audience.</p>
          <div className="space-y-3">
            <input className={inputClass} placeholder="Full name *" value={affiliateForm.name} onChange={(e) => setAffiliateForm({...affiliateForm, name: e.target.value})} />
            <input className={inputClass} placeholder="Email *" type="email" value={affiliateForm.email} onChange={(e) => setAffiliateForm({...affiliateForm, email: e.target.value})} />
            <input className={inputClass} placeholder="Website / Social media URL" value={affiliateForm.website} onChange={(e) => setAffiliateForm({...affiliateForm, website: e.target.value})} />
            <input className={inputClass} placeholder="Audience size & niche" value={affiliateForm.audience} onChange={(e) => setAffiliateForm({...affiliateForm, audience: e.target.value})} />
            <button onClick={submitAffiliate} disabled={submitting} className={submitBtnClass}>
              <UserPlus size={14} /> {submitting ? "Submitting..." : "Apply as Affiliate"}
            </button>
          </div>
        </FormModal>
      )}

      {/* Join Team */}
      {showJoinTeam && (
        <FormModal title="Join the Team" onClose={() => setShowJoinTeam(false)}>
          <p className="text-sm text-muted-foreground mb-4">We're looking for passionate builders. Tell us about yourself.</p>
          <div className="space-y-3">
            <input className={inputClass} placeholder="Full name *" value={joinTeamForm.name} onChange={(e) => setJoinTeamForm({...joinTeamForm, name: e.target.value})} />
            <input className={inputClass} placeholder="Email *" type="email" value={joinTeamForm.email} onChange={(e) => setJoinTeamForm({...joinTeamForm, email: e.target.value})} />
            <select className={inputClass} value={joinTeamForm.role} onChange={(e) => setJoinTeamForm({...joinTeamForm, role: e.target.value})}>
              <option value="">Select role *</option>
              <option value="frontend">Frontend Developer</option>
              <option value="backend">Backend Developer</option>
              <option value="3d_artist">3D Artist</option>
              <option value="ai_ml">AI/ML Engineer</option>
              <option value="design">Product Designer</option>
              <option value="marketing">Marketing</option>
              <option value="content">Content Creator</option>
              <option value="other">Other</option>
            </select>
            <input className={inputClass} placeholder="Portfolio / LinkedIn URL" value={joinTeamForm.portfolio} onChange={(e) => setJoinTeamForm({...joinTeamForm, portfolio: e.target.value})} />
            <textarea className={textareaClass} rows={3} placeholder="Why do you want to join Discoverse?" value={joinTeamForm.why} onChange={(e) => setJoinTeamForm({...joinTeamForm, why: e.target.value})} />
            <button onClick={submitJoinTeam} disabled={submitting} className={submitBtnClass}>
              <Briefcase size={14} /> {submitting ? "Submitting..." : "Apply Now"}
            </button>
          </div>
        </FormModal>
      )}

      {/* Invest */}
      {showInvest && (
        <FormModal title="Invest in Discoverse" onClose={() => setShowInvest(false)}>
          <p className="text-sm text-muted-foreground mb-4">Join us in building the future of AI-powered education. For direct contact: discoverseai@gmail.com</p>
          <div className="space-y-3">
            <input className={inputClass} placeholder="Full name *" value={investForm.name} onChange={(e) => setInvestForm({...investForm, name: e.target.value})} />
            <input className={inputClass} placeholder="Email *" type="email" value={investForm.email} onChange={(e) => setInvestForm({...investForm, email: e.target.value})} />
            <input className={inputClass} placeholder="Company / Fund name" value={investForm.company} onChange={(e) => setInvestForm({...investForm, company: e.target.value})} />
            <input className={inputClass} placeholder="Investment range (e.g. $10k-$50k)" value={investForm.amount} onChange={(e) => setInvestForm({...investForm, amount: e.target.value})} />
            <textarea className={textareaClass} rows={3} placeholder="Tell us about your interest..." value={investForm.message} onChange={(e) => setInvestForm({...investForm, message: e.target.value})} />
            <button onClick={submitInvest} disabled={submitting} className={submitBtnClass}>
              <DollarSign size={14} /> {submitting ? "Submitting..." : "Submit Investment Inquiry"}
            </button>
            <p className="text-[11px] text-muted-foreground text-center">Direct email: discoverseai@gmail.com</p>
          </div>
        </FormModal>
      )}

      {/* Content Policy */}
      {showContentPolicy && (
        <FormModal title="Content & Licensing Policy" onClose={() => setShowContentPolicy(false)}>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <div>
              <h4 className="font-bold text-foreground mb-1">📋 3D Model Licenses</h4>
              <p>All 3D models on Discoverse are sourced under Creative Commons (CC BY, CC BY-SA, CC BY-NC), open-source licenses, or created in-house. Each model displays its license type. Commercial use models require Pro or Enterprise plans.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-1">🚫 Inappropriate Content</h4>
              <p>We maintain strict content moderation. No NSFW, violent, hateful, or misleading content is permitted. AI agents must follow community guidelines. Violations result in immediate removal and account suspension.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-1">📝 Content License for Creators</h4>
              <p>When you create an AI agent on Discoverse, you retain ownership of your prompts and configurations. By publishing, you grant Discoverse a non-exclusive license to distribute and display your agent. You can unpublish at any time.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground mb-1">⚠️ Report Issues</h4>
              <p>Found inappropriate content or license violations? Report immediately to <a href="mailto:discoversesupport@gmail.com" className="text-accent font-bold">discoversesupport@gmail.com</a></p>
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
