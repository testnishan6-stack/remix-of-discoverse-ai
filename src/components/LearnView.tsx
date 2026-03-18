import { useState, useCallback } from "react";
import {
  Sparkles, ChevronLeft, ChevronRight, Play, Pause,
  Volume2, Share2, RotateCcw, ZoomIn, ZoomOut, Maximize2, Atom,
} from "lucide-react";
import { ModelViewer } from "./ModelViewer";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";

const demoSteps = [
  { title: "Overview: The Human Heart", part: "", narrationEn: "The human heart is a muscular organ roughly the size of your fist. It beats about 100,000 times a day, pumping blood throughout your body.", narrationHi: "मानव हृदय एक पेशीय अंग है जो लगभग आपकी मुट्ठी के आकार का होता है। यह दिन में लगभग 1,00,000 बार धड़कता है।", labelEn: "Heart", labelHi: "हृदय", color: "#CC4444" },
  { title: "The Left Ventricle: The Powerhouse", part: "left_ventricle", narrationEn: "The left ventricle is the strongest chamber. It pumps oxygenated blood to the entire body through the aorta.", narrationHi: "बायां निलय सबसे शक्तिशाली कक्ष है। यह महाधमनी के माध्यम से पूरे शरीर में ऑक्सीजन युक्त रक्त पंप करता है।", labelEn: "Left Ventricle", labelHi: "बायां निलय", color: "#8B0000" },
  { title: "The Aorta: Highway of Life", part: "aorta", narrationEn: "The aorta is the largest artery in your body, carrying oxygen-rich blood from the left ventricle to all organs.", narrationHi: "महाधमनी आपके शरीर की सबसे बड़ी धमनी है।", labelEn: "Aorta", labelHi: "महाधमनी", color: "#CC2222" },
  { title: "The Right Atrium: Receiving Chamber", part: "right_atrium", narrationEn: "The right atrium receives deoxygenated blood from the body through the vena cava.", narrationHi: "दायां अलिंद वेना कावा के माध्यम से शरीर से रक्त प्राप्त करता है।", labelEn: "Right Atrium", labelHi: "दायां अलिंद", color: "#4444AA" },
  { title: "The Complete Cardiac Cycle", part: "", narrationEn: "All chambers work together in perfect rhythm, ensuring continuous blood flow throughout your body.", narrationHi: "सभी कक्ष एक साथ लयबद्ध तरीके से काम करते हैं।", labelEn: "Cardiac Cycle", labelHi: "हृदय चक्र", color: "#CC4444" },
];

const topicSuggestions = ["Human Heart", "DNA Structure", "Solar System", "Atom Model", "Cell Division", "Water Molecule"];

export function LearnView() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasSimulation, setHasSimulation] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelParts, setModelParts] = useState<string[]>([]);
  const { language } = useApp();

  const step = demoSteps[currentStep];

  const handleGenerate = async (topic?: string) => {
    const t = topic || topicInput;
    if (!t.trim()) return;
    setTopicInput(t);
    setIsLoading(true);

    // Search for model in database
    const slug = t.toLowerCase().replace(/\s+/g, "_");
    const { data: model } = await supabase
      .from("models")
      .select("*")
      .or(`slug.eq.${slug},keywords_en.cs.{${t.toLowerCase()}}`)
      .eq("status", "published")
      .order("viral_score", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (model?.file_url) {
      setModelUrl(model.file_url);
    } else {
      setModelUrl(null);
    }

    setTimeout(() => {
      setIsLoading(false);
      setHasSimulation(true);
      setCurrentStep(0);
    }, 1500);
  };

  const onPartsLoaded = useCallback((parts: string[]) => {
    setModelParts(parts);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col p-4 md:p-5 gap-3 min-w-0">
        {/* Topic input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Sparkles size={16} strokeWidth={1.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent" />
            <input
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="Enter any topic to explore in 3D..."
              className="w-full bg-card border border-border rounded-xl h-11 pl-10 pr-4 text-[14px] text-primary-custom placeholder:text-tertiary-custom focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            onClick={() => handleGenerate()}
            className="bg-primary text-primary-foreground px-5 rounded-xl text-[13px] font-medium hover:opacity-90 transition-opacity active:scale-[0.97]"
          >
            Generate
          </button>
        </div>

        {/* Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {topicSuggestions.map((t) => (
            <button
              key={t}
              onClick={() => handleGenerate(t)}
              className="shrink-0 px-3 py-1.5 bg-card border border-border rounded-lg text-[12px] text-secondary-custom hover:border-accent hover:text-accent transition-all duration-150"
            >
              {t}
            </button>
          ))}
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 bg-canvas rounded-2xl border border-subtle overflow-hidden relative min-h-[280px] shadow-sm">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-border overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: "65%", transition: "width 1.5s ease-out" }} />
              </div>
              <Atom size={48} strokeWidth={1} className="text-tertiary-custom mb-3 animate-spin" style={{ animationDuration: "3s" }} />
              <p className="text-[14px] text-secondary-custom">Searching for the best model...</p>
              <p className="text-[12px] text-tertiary-custom mt-1">{topicInput}</p>
            </div>
          ) : hasSimulation ? (
            <>
              <ModelViewer
                modelUrl={modelUrl}
                highlightPart={step.part || undefined}
                highlightColor={step.color}
                onPartsLoaded={onPartsLoaded}
              />
              {/* Label overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border px-4 py-2 rounded-xl shadow-sm animate-fade-in" key={currentStep}>
                <p className="text-[13px] font-medium text-primary-custom">
                  {language === "en" ? step.labelEn : step.labelHi}
                </p>
              </div>
              {/* Canvas controls */}
              <div className="absolute top-3 right-3 flex flex-col gap-0.5 bg-card/90 backdrop-blur-sm border border-border rounded-xl p-1">
                {[RotateCcw, ZoomIn, ZoomOut, Maximize2].map((Icon, i) => (
                  <button key={i} className="p-1.5 hover:bg-background-secondary rounded-lg transition-colors">
                    <Icon size={14} strokeWidth={1.5} className="text-secondary-custom" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <ModelViewer modelUrl={null} />
            </div>
          )}
        </div>
      </div>

      {/* Step Panel */}
      {hasSimulation && !isLoading && (
        <div className="md:w-[360px] lg:w-[380px] bg-card border-t md:border-t-0 md:border-l border-subtle flex flex-col shrink-0">
          <div className="p-5 pb-0">
            <h2 className="text-[18px] font-semibold text-primary-custom">{topicInput || "Simulation"}</h2>
            <p className="text-[12px] text-tertiary-custom mt-1">Interactive 3D · {demoSteps.length} Steps</p>
          </div>

          {/* Step nav */}
          <div className="px-5 pt-4 flex items-center justify-between">
            <span className="label-text text-tertiary-custom">Step {currentStep + 1} of {demoSteps.length}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="p-1.5 border border-border rounded-lg disabled:opacity-20 hover:bg-background-secondary transition-colors"
              >
                <ChevronLeft size={14} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setCurrentStep(Math.min(demoSteps.length - 1, currentStep + 1))}
                disabled={currentStep === demoSteps.length - 1}
                className="p-1.5 border border-border rounded-lg disabled:opacity-20 hover:bg-background-secondary transition-colors"
              >
                <ChevronRight size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-1.5 py-4 px-5">
            {demoSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className="h-2 rounded-full transition-all"
                style={{
                  width: i === currentStep ? 20 : 8,
                  backgroundColor: i === currentStep ? "hsl(var(--accent))" : "hsl(var(--border))",
                  transition: "width 250ms ease-in-out, background-color 150ms",
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 animate-fade-in" key={currentStep}>
            <h3 className="text-[16px] font-semibold text-primary-custom mb-2">{step.title}</h3>
            <p className="text-[14px] text-secondary-custom leading-relaxed">
              {language === "en" ? step.narrationEn : step.narrationHi}
            </p>
            {/* Audio indicator */}
            <div className="flex items-center gap-2 mt-4">
              <div className="flex items-end gap-[2px]">
                {[10, 16, 7].map((h, i) => (
                  <div
                    key={i}
                    className="w-[2.5px] bg-accent rounded-full transition-all"
                    style={{ height: isPlaying ? h : 3, transitionDuration: "300ms", transitionDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
              <span className="text-[11px] text-tertiary-custom">
                {isPlaying ? (language === "en" ? "Speaking in English" : "हिंदी में बोल रहा है") : "Ready to play"}
              </span>
            </div>
          </div>

          {/* Playback */}
          <div className="p-4 border-t border-subtle flex items-center justify-between">
            <div className="flex rounded-full overflow-hidden border border-border h-7">
              {(["en", "hi"] as const).map((l) => (
                <button key={l} className={`px-2.5 text-[11px] font-medium transition-colors ${
                  language === l ? "bg-accent text-accent-foreground" : "text-secondary-custom"
                }`}>
                  {l === "en" ? "EN" : "हिं"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity active:scale-[0.97]"
            >
              {isPlaying ? <Pause size={16} className="text-primary-foreground" /> : <Play size={16} className="text-primary-foreground ml-0.5" />}
            </button>
            <div className="flex gap-2.5">
              <Volume2 size={16} strokeWidth={1.5} className="text-tertiary-custom cursor-pointer hover:text-secondary-custom transition-colors" />
              <Share2 size={16} strokeWidth={1.5} className="text-tertiary-custom cursor-pointer hover:text-secondary-custom transition-colors" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
