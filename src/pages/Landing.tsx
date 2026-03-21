import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import {
  ArrowRight, Sparkles, Bot, BookOpen, Zap, Brain, Globe,
  ChevronRight, Users, TrendingUp, Award, Check, X, Mail,
  Shield, Handshake, FileText, MessageSquare, Menu, ExternalLink,
  Star, Rocket, Eye, Play, Cpu, Lock, Crown
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
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
        filter: visible ? "blur(0)" : "blur(6px)",
        transition: `all 800ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
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
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function GlowOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{ animation: `float-y 8s ease-in-out infinite ${delay}s, pulse-glow-orb 4s ease-in-out infinite ${delay + 1}s` }}
    />
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
  { feature: "One-size-fits-all", us: false, them: true },
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
  { icon: Zap, title: "Point-to-Point", desc: "No fluff. No essays. Direct explanations that make you go 'ohh, that's how it works!'", gradient: "from-yellow-500/20 to-yellow-500/5" },
  { icon: Lock, title: "Privacy First", desc: "Your conversations stay private. No data selling. No tracking. Your learning, your business.", gradient: "from-green-500/20 to-green-500/5" },
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
  { label: "Compare", href: "#compare" },
  { label: "Contact", href: "#contact" },
];

export default function Landing() {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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

  const scrollTo = (id: string) => {
    setMobileMenu(false);
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <style>{`
        @keyframes float-y { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes rotate-slow { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 hsla(17,62%,60%,0.3)} 50%{box-shadow:0 0 0 14px hsla(17,62%,60%,0)} }
        @keyframes pulse-glow-orb { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes text-reveal { from{clip-path:inset(0 100% 0 0)} to{clip-path:inset(0 0 0 0)} }
        @keyframes float-card { 0%,100%{transform:translateY(0) rotate(0deg)} 25%{transform:translateY(-8px) rotate(1deg)} 75%{transform:translateY(4px) rotate(-1deg)} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .gradient-text { background: linear-gradient(135deg, hsl(17,62%,60%), hsl(262,52%,55%), hsl(200,62%,50%)); background-size: 200% 200%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: gradient-shift 4s ease infinite; }
        .glass-card { background: hsla(0,0%,100%,0.7); backdrop-filter: blur(20px); border: 1px solid hsla(30,18%,88%,0.5); }
        .hover-lift { transition: all 400ms cubic-bezier(0.16,1,0.3,1); }
        .hover-lift:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 20px 40px -12px hsla(17,62%,60%,0.15); }
      `}</style>

      {/* ═══ NAV ═══ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50 ? "bg-background/90 backdrop-blur-2xl shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-5">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="text-[16px] font-semibold text-primary-custom tracking-tight">Discoverse</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.href)} className="text-[13px] text-secondary-custom hover:text-accent transition-colors font-medium relative group">
                {l.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent rounded-full transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/auth")} className="hidden sm:block text-[13px] text-secondary-custom hover:text-primary-custom transition-colors font-medium">
              Sign in
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="bg-primary text-primary-foreground text-[13px] font-medium px-4 py-2 rounded-xl hover:opacity-90 active:scale-[0.97] transition-all shadow-lg shadow-primary/10"
            >
              Get Started
            </button>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-1">
              <Menu size={20} className="text-primary-custom" />
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden glass-card mx-3 mb-2 rounded-2xl px-5 py-3 space-y-2 animate-fade-in">
            {NAV_LINKS.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.href)} className="block w-full text-left text-[14px] text-secondary-custom py-2 hover:text-accent">{l.label}</button>
            ))}
            <button onClick={() => { setMobileMenu(false); navigate("/auth"); }} className="block w-full text-left text-[14px] text-accent font-medium py-2">Sign in →</button>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="pt-24 pb-20 px-5 relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Animated background orbs with parallax */}
        <GlowOrb className="top-16 left-8 w-72 h-72 bg-accent/8 blur-[80px]" />
        <GlowOrb className="top-32 right-12 w-96 h-96 bg-purple-500/5 blur-[100px]" delay={2} />
        <GlowOrb className="bottom-20 left-1/3 w-64 h-64 bg-blue-500/5 blur-[80px]" delay={4} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -10}px)`,
        }} />

        {/* Floating 3D preview card - parallax with mouse */}
        <div
          className="absolute right-4 top-28 w-[260px] h-[280px] hidden lg:block"
          style={{ transform: `translate(${mousePos.x * -20}px, ${(scrollY * -0.12) + mousePos.y * -15}px)` }}
        >
          <div className="relative w-full h-full" style={{ animation: "float-card 8s ease-in-out infinite" }}>
            <div className="absolute inset-0 rounded-3xl glass-card shadow-2xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-2 border-accent/20" style={{ animation: "rotate-slow 12s linear infinite" }}>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-3 h-3 rounded-full bg-accent shadow-lg shadow-accent/50" />
                  </div>
                  <div className="absolute inset-3 rounded-full border border-purple-500/20" style={{ animation: "rotate-slow 8s linear infinite reverse" }}>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-purple-500/60" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Globe size={28} strokeWidth={0.8} className="text-accent/50" />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 bg-card/95 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-subtle">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[11px] font-semibold text-primary-custom">Human Heart</p>
                </div>
                <p className="text-[9px] text-tertiary-custom">Step 3 of 6 · AI Narrating</p>
                <div className="flex gap-0.5 mt-1.5">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-all duration-500" style={{ backgroundColor: i <= 3 ? "hsl(var(--accent))" : "hsl(var(--border))" }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -inset-6 rounded-3xl border border-accent/10" style={{ animation: "pulse-glow 3s ease-in-out infinite" }} />
          </div>
        </div>

        <div className="max-w-3xl mx-auto text-center lg:text-left w-full relative z-10">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 glass-card rounded-full px-4 py-1.5 mb-6"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(16px)",
              transition: "all 600ms cubic-bezier(0.16,1,0.3,1) 100ms",
            }}
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[12px] font-medium text-accent">2,847 learners online now</span>
          </div>

          <h1
            className="text-[clamp(2.2rem,7vw,4rem)] font-bold text-primary-custom leading-[1.05] tracking-tight mb-5"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(20px)",
              transition: "all 800ms cubic-bezier(0.16,1,0.3,1) 200ms",
            }}
          >
            The Future of
            <br />
            <span className="gradient-text">AI Learning</span> is Here.
          </h1>

          <p
            className="text-[clamp(0.95rem,2.2vw,1.15rem)] text-secondary-custom leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(14px)",
              transition: "all 700ms cubic-bezier(0.16,1,0.3,1) 400ms",
            }}
          >
            Creator-built AI agents with real personalities. 3D simulations with voice narration. 
            <span className="text-primary-custom font-medium"> Understand anything in seconds</span> — not hours.
          </p>

          <div
            className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3"
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(12px)",
              transition: "all 700ms cubic-bezier(0.16,1,0.3,1) 550ms",
            }}
          >
            <button
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto bg-accent text-accent-foreground text-[15px] font-semibold px-8 py-3.5 rounded-2xl hover:opacity-90 active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-xl shadow-accent/25"
              style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
            >
              Start Learning Free <ArrowRight size={18} />
            </button>
            <button
              onClick={() => scrollTo("#agents")}
              className="w-full sm:w-auto glass-card text-[14px] font-medium text-primary-custom px-7 py-3.5 rounded-2xl hover:bg-card active:scale-[0.97] transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                <Play size={14} className="text-accent" /> Watch Demo
              </span>
            </button>
          </div>

          {/* Social proof */}
          <div
            className="mt-10 flex items-center gap-4 justify-center lg:justify-start"
            style={{
              opacity: heroVisible ? 1 : 0,
              transition: "all 700ms cubic-bezier(0.16,1,0.3,1) 750ms",
            }}
          >
            <div className="flex -space-x-2.5">
              {["R","A","S","M","K"].map((l, i) => (
                <div key={l} className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-[11px] font-bold text-white shadow-md" style={{ backgroundColor: ["hsl(17,62%,60%)","hsl(262,52%,55%)","hsl(200,62%,50%)","hsl(150,52%,45%)","hsl(340,52%,55%)"][i] }}>
                  {l}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="hsl(45,92%,55%)" className="text-yellow-400" />)}
              </div>
              <p className="text-[11px] text-tertiary-custom mt-0.5">
                <span className="text-primary-custom font-semibold">4.9/5</span> from 2,847 learners
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SCROLLING BRANDS / TRUST ═══ */}
      <section className="py-6 border-y border-subtle overflow-hidden">
        <div className="flex items-center" style={{ animation: "marquee 20s linear infinite" }}>
          {["🔬 Science", "📐 Mathematics", "💻 Coding", "🧬 Biology", "⚛️ Physics", "🌍 Geography", "📊 Data Science", "🎨 Design", "🔬 Science", "📐 Mathematics", "💻 Coding", "🧬 Biology", "⚛️ Physics", "🌍 Geography", "📊 Data Science", "🎨 Design"].map((item, i) => (
            <span key={i} className="text-[13px] text-tertiary-custom font-medium whitespace-nowrap mx-8">{item}</span>
          ))}
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-12 px-5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 100}>
              <div className="glass-card rounded-2xl p-5 text-center hover-lift cursor-default">
                <div className="w-10 h-10 rounded-xl bg-accent/8 flex items-center justify-center mx-auto mb-3">
                  <stat.icon size={20} strokeWidth={1.5} className="text-accent" />
                </div>
                <p className="text-[clamp(1.4rem,3.5vw,2rem)] font-bold text-primary-custom tabular-nums">
                  <Counter target={stat.target} />
                </p>
                <p className="text-[11px] text-tertiary-custom mt-1 font-medium">{stat.label}</p>
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
              <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">Agent Marketplace</span>
            </div>
            <h2 className="text-[clamp(1.5rem,4.5vw,2.2rem)] font-bold text-primary-custom">
              Specialized AI, not generic chatbots
            </h2>
            <p className="text-[14px] text-secondary-custom mt-3 max-w-md mx-auto">Every agent is built by a creator with real expertise — not scraped from the internet.</p>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AGENTS.map((agent, i) => (
              <Reveal key={agent.name} delay={i * 80}>
                <div className="glass-card rounded-2xl p-4 hover-lift cursor-pointer group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ backgroundColor: agent.color }} />
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 relative" style={{ backgroundColor: `${agent.color}15` }}>
                    {agent.emoji}
                  </div>
                  <h3 className="text-[14px] font-bold text-primary-custom">{agent.name}</h3>
                  <p className="text-[11px] text-tertiary-custom mt-0.5">{agent.role}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-secondary-custom flex items-center gap-1">
                      <Users size={10} /> {agent.users} users
                    </span>
                    <span className="text-[11px] text-accent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-0.5 font-medium">
                      Chat <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-8 text-center" delay={500}>
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-[13px] font-semibold px-6 py-3 rounded-xl hover:opacity-90 active:scale-[0.97] transition-all shadow-lg shadow-accent/20"
            >
              <Sparkles size={14} /> Create Your Own Agent
            </button>
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
              <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">Why Discoverse</span>
            </div>
            <h2 className="text-[clamp(1.5rem,4.5vw,2.2rem)] font-bold text-primary-custom">
              Built for instant understanding
            </h2>
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
                    <h3 className="text-[15px] font-bold text-primary-custom mb-2">{f.title}</h3>
                    <p className="text-[13px] text-secondary-custom leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON ═══ */}
      <section id="compare" className="py-16 px-5">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-accent/8 border border-accent/15 rounded-full px-4 py-1.5 mb-4">
              <Eye size={13} className="text-accent" />
              <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">The Difference</span>
            </div>
            <h2 className="text-[clamp(1.5rem,4.5vw,2.2rem)] font-bold text-primary-custom">
              Discoverse vs Generic AI
            </h2>
            <p className="text-[14px] text-secondary-custom mt-2">ChatGPT, Gemini, Claude — they're great at text. We're built for <span className="gradient-text font-semibold">understanding</span>.</p>
          </Reveal>

          <Reveal>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 border-b border-border bg-accent/5">
                <div className="p-4 text-[12px] font-semibold text-secondary-custom">Feature</div>
                <div className="p-4 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <Logo size={16} />
                    <span className="text-[12px] font-bold text-accent">Discoverse</span>
                  </div>
                </div>
                <div className="p-4 text-center text-[12px] font-semibold text-tertiary-custom">Others</div>
              </div>
              {COMPARE.map((row, i) => (
                <Reveal key={row.feature} delay={i * 50}>
                  <div className={`grid grid-cols-3 ${i < COMPARE.length - 1 ? "border-b border-subtle" : ""} hover:bg-accent/3 transition-colors`}>
                    <div className="p-3 md:p-4 text-[12px] md:text-[13px] text-primary-custom flex items-center font-medium">{row.feature}</div>
                    <div className="p-3 md:p-4 flex items-center justify-center">
                      {row.us ? (
                        <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center">
                          <Check size={14} className="text-accent" strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-background-secondary flex items-center justify-center">
                          <X size={14} className="text-tertiary-custom" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 md:p-4 flex items-center justify-center">
                      {row.them ? (
                        <div className="w-7 h-7 rounded-full bg-background-secondary flex items-center justify-center">
                          <Check size={14} className="text-tertiary-custom" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-background-secondary flex items-center justify-center">
                          <X size={14} className="text-tertiary-custom" />
                        </div>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-16 px-5 relative">
        <GlowOrb className="bottom-0 left-1/4 w-64 h-64 bg-accent/5 blur-[80px]" delay={3} />
        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-accent/8 border border-accent/15 rounded-full px-4 py-1.5 mb-4">
              <MessageSquare size={13} className="text-accent" />
              <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">Loved by Learners</span>
            </div>
            <h2 className="text-[clamp(1.5rem,4.5vw,2.2rem)] font-bold text-primary-custom">
              What our community says
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 120}>
                <div className="glass-card rounded-2xl p-5 hover-lift">
                  <div className="flex items-center gap-0.5 mb-3">
                    {[1,2,3,4,5].map(s => <Star key={s} size={12} fill="hsl(45,92%,55%)" className="text-yellow-400" />)}
                  </div>
                  <p className="text-[13px] text-primary-custom leading-relaxed mb-4">"{t.text}"</p>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-[12px] font-bold text-accent">{t.avatar}</div>
                    <div>
                      <p className="text-[12px] font-semibold text-primary-custom">{t.name}</p>
                      <p className="text-[10px] text-tertiary-custom">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 3D SECTION ═══ */}
      <section className="py-16 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/3 to-background" />
        <div className="max-w-4xl mx-auto relative z-10">
          <Reveal>
            <div className="glass-card rounded-3xl p-8 md:p-14 relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-purple-500 to-blue-500" />
              <div className="absolute top-8 right-10 opacity-15" style={{ animation: "float-y 5s ease-in-out infinite 1s" }}>
                <Cpu size={32} className="text-accent" />
              </div>
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6" style={{ animation: "float-y 4s ease-in-out infinite" }}>
                <Globe size={32} strokeWidth={1} className="text-accent" />
              </div>
              <h2 className="text-[clamp(1.5rem,4.5vw,2.2rem)] font-bold text-primary-custom mb-3">
                Interactive 3D Simulations
              </h2>
              <p className="text-[14px] text-secondary-custom max-w-md mx-auto mb-8 leading-relaxed">
                Real 3D models with AI step-by-step narration. Not animations — actual interactive models you can rotate, zoom, and explore.
              </p>
              <button
                onClick={() => navigate("/auth")}
                className="bg-primary text-primary-foreground text-[14px] font-semibold px-7 py-3 rounded-xl hover:opacity-90 active:scale-[0.97] transition-all shadow-xl shadow-primary/15"
              >
                Try a Simulation →
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 px-5 relative">
        <GlowOrb className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/8 blur-[120px]" />
        <Reveal className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-[clamp(1.8rem,6vw,2.8rem)] font-bold text-primary-custom mb-4 leading-tight">
            Ready to learn <span className="gradient-text">differently?</span>
          </h2>
          <p className="text-[15px] text-secondary-custom mb-8 leading-relaxed">
            Join thousands of students using specialized AI agents to understand complex topics instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto bg-accent text-accent-foreground text-[15px] font-semibold px-10 py-4 rounded-2xl hover:opacity-90 active:scale-[0.97] transition-all shadow-xl shadow-accent/25"
              style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
            >
              Get Started Free
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto glass-card text-[14px] font-medium text-primary-custom px-8 py-4 rounded-2xl hover:bg-card active:scale-[0.97] transition-all"
            >
              Create an Agent
            </button>
          </div>
          <p className="text-[11px] text-tertiary-custom mt-4">No credit card required · 5 free generations/week</p>
        </Reveal>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer id="contact" className="border-t border-border">
        <div className="max-w-6xl mx-auto px-5 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Logo size={24} />
                <span className="text-[15px] font-bold text-primary-custom">Discoverse</span>
              </div>
              <p className="text-[12px] text-tertiary-custom leading-relaxed mb-3">
                AI-powered learning platform with specialized agents and 3D simulations.
              </p>
              <p className="text-[11px] text-tertiary-custom">discoverseai.com</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-primary-custom uppercase tracking-wider mb-3">Product</p>
              <div className="space-y-2">
                {["AI Agents", "3D Simulations", "Learn Mode", "Create Agent"].map(l => (
                  <button key={l} onClick={() => navigate("/auth")} className="block text-[13px] text-secondary-custom hover:text-accent transition-colors">{l}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-primary-custom uppercase tracking-wider mb-3">Company</p>
              <div className="space-y-2">
                <a href="mailto:iscillatechnologies@gmail.com" className="block text-[13px] text-secondary-custom hover:text-accent transition-colors">Contact Us</a>
                <a href="mailto:iscillatechnologies@gmail.com?subject=Affiliate%20Partnership" className="block text-[13px] text-secondary-custom hover:text-accent transition-colors">Become Affiliate</a>
                <a href="mailto:iscillatechnologies@gmail.com?subject=Partnership" className="block text-[13px] text-secondary-custom hover:text-accent transition-colors">Partner With Us</a>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-primary-custom uppercase tracking-wider mb-3">Legal</p>
              <div className="space-y-2">
                <button onClick={() => navigate("/privacy")} className="block text-[13px] text-secondary-custom hover:text-accent transition-colors">Privacy Policy</button>
                <button onClick={() => navigate("/terms")} className="block text-[13px] text-secondary-custom hover:text-accent transition-colors">Terms of Service</button>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-tertiary-custom">
              © {new Date().getFullYear()} Discoverse by Iscilla Technologies. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="mailto:iscillatechnologies@gmail.com" className="text-tertiary-custom hover:text-accent transition-colors">
                <Mail size={16} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
