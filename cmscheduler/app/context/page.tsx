"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { getAISettings, saveAISettings, type AISettings } from "@/utils/localStorageHelpers";

const carmaxBlue = "#003366";

const animationStyles = `
  @keyframes floatA {
    0%, 100% { transform: translateY(0px) rotate(12deg); }
    50% { transform: translateY(-18px) rotate(14deg); }
  }
  @keyframes floatB {
    0%, 100% { transform: scaleX(-1) rotate(-12deg) translateX(40px) translateY(-40px); }
    50% { transform: scaleX(-1) rotate(-10deg) translateX(40px) translateY(-58px); }
  }
  @keyframes floatC {
    0%, 100% { transform: translateY(0px) rotate(-6deg); }
    50% { transform: translateY(-12px) rotate(-8deg); }
  }
  @keyframes floatD {
    0%, 100% { transform: scaleX(-1) rotate(6deg) translateX(24px) translateY(32px); }
    50% { transform: scaleX(-1) rotate(8deg) translateX(24px) translateY(20px); }
  }
  @keyframes orbPulse {
    0%, 100% { opacity: 0.12; transform: scale(1); }
    50% { opacity: 0.18; transform: scale(1.08); }
  }
  @keyframes orbPulse2 {
    0%, 100% { opacity: 0.10; transform: scale(1); }
    50% { opacity: 0.15; transform: scale(1.06); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .anim-float-a { animation: floatA 7s ease-in-out infinite; }
  .anim-float-b { animation: floatB 8s ease-in-out infinite; }
  .anim-float-c { animation: floatC 9s ease-in-out infinite 1s; }
  .anim-float-d { animation: floatD 10s ease-in-out infinite 0.5s; }
  .anim-orb-1   { animation: orbPulse 6s ease-in-out infinite; }
  .anim-orb-2   { animation: orbPulse2 8s ease-in-out infinite 2s; }
  .anim-fade-up-1 { animation: fadeUp 0.5s ease-out both; }
  .anim-fade-up-2 { animation: fadeUp 0.5s ease-out 0.12s both; }
  .anim-fade-up-3 { animation: fadeUp 0.5s ease-out 0.24s both; }
  .anim-fade-up-4 { animation: fadeUp 0.5s ease-out 0.36s both; }
  .anim-fade-up-5 { animation: fadeUp 0.5s ease-out 0.48s both; }
`;

function CarIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 640 512" fill="white" className={className} style={style}>
      <path d="M171.3 96H224v96H111.3l30.4-75.9C146.5 102 158.2 96 171.3 96zM272 192V96h81.2c9.7 0 18.9 4.4 25 12l67.2 84H272zm256.2 1L428.2 68c-18.2-22.8-45.8-36-75-36H171.3c-39.3 0-74.6 23.9-89.1 60.3L40.6 196.4C16.8 205.8 0 228.9 0 256V368c0 17.7 14.3 32 32 32H65.3c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80H385.3c7.6 45.4 47.1 80 94.7 80s87.1-34.6 94.7-80H608c17.7 0 32-14.3 32-32V320c0-65.2-48.8-119-111.8-127zM160 368a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm256 0a48 48 0 1 1 96 0 48 48 0 1 1 -96 0z" />
    </svg>
  );
}

export default function ContextPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AISettings>({ enabled: false, contextPrompt: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getAISettings());
  }, []);

  const handleSave = () => {
    saveAISettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    const cleared: AISettings = { enabled: false, contextPrompt: "" };
    saveAISettings(cleared);
    setSettings(cleared);
  };

  return (
    <div
      className="relative min-h-screen flex flex-col text-slate-900 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #001a33 0%, #003366 55%, #00244d 85%, #1a1200 100%)" }}
    >
      <style>{animationStyles}</style>
      {/* Yellow glow orbs */}
      <div className="anim-orb-1 pointer-events-none fixed top-[-120px] right-[-80px] w-[420px] h-[420px] rounded-full" style={{ background: "radial-gradient(circle, #f5c400 0%, transparent 70%)" }} />
      <div className="anim-orb-2 pointer-events-none fixed bottom-[-100px] left-[-60px] w-[320px] h-[320px] rounded-full" style={{ background: "radial-gradient(circle, #e6a800 0%, transparent 70%)" }} />
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] opacity-[0.05]" style={{ background: "radial-gradient(ellipse, #ffd000 0%, transparent 70%)" }} />
      <CarIcon className="anim-float-a pointer-events-none fixed top-0 left-0 w-64 -translate-x-10 -translate-y-10 opacity-[0.08]" />
      <CarIcon
        className="anim-float-b pointer-events-none fixed top-0 right-0 w-64 opacity-[0.08]"
        style={{ transform: "scaleX(-1) rotate(-12deg) translateX(40px) translateY(-40px)" }}
      />
      <CarIcon className="anim-float-c pointer-events-none fixed bottom-0 left-0 w-48 -translate-x-6 translate-y-8 opacity-[0.06]" />
      <CarIcon className="anim-float-d pointer-events-none fixed bottom-0 right-0 w-48 opacity-[0.06]" style={{ transform: "scaleX(-1) rotate(6deg) translateX(24px) translateY(32px)" }} />
      <CarIcon className="pointer-events-none fixed top-1/2 left-0 w-32 -translate-x-8 -translate-y-1/2 rotate-6 opacity-[0.04]" />
      <CarIcon className="pointer-events-none fixed top-1/3 right-0 w-24 opacity-[0.04]" style={{ transform: "scaleX(-1) rotate(-8deg) translateX(24px)" }} />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="flex-1 mx-auto max-w-2xl w-full px-4 py-10 flex flex-col">
        {/* Header */}
        <div className="anim-fade-up-1 mb-8 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
          >
            ← Back
          </button>
          <img src="/SCHEDULE_MAX.png" alt="ScheduleMax" className="h-9 w-auto object-contain" />
          <span className="text-white/40 text-lg font-light">|</span>
          <h1 className="text-xl font-bold text-white">AI Assistant</h1>
          <span className="rounded-full bg-blue-500/30 px-2 py-0.5 text-xs font-semibold text-blue-200">
            Beta
          </span>
        </div>

        {/* Enable toggle */}
        <div className="anim-fade-up-2 mb-5 rounded-xl bg-white px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">Enable AI Assistance</p>
              <p className="mt-0.5 text-sm text-slate-500">
                When enabled, the AI will use your notes below to adjust the generated schedule.
              </p>
            </div>
            <button
              onClick={() => setSettings((s) => ({ ...s, enabled: !s.enabled }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                settings.enabled ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {settings.enabled && (
          <>
            {/* Context prompt */}
            <div className="anim-fade-up-3 mb-5 rounded-xl bg-white px-6 py-5 shadow-sm">
              <h2 className="mb-1 font-semibold text-slate-800">Scheduling Notes</h2>
              <p className="mb-3 text-sm text-slate-500">
                Describe anything the AI should take into account when building this week&apos;s schedule:
                shift preferences, coverage needs, people who shouldn&apos;t work together, special events, etc.
              </p>
              <textarea
                rows={8}
                placeholder={
                  "Examples:\n" +
                  "- John needs to close on Friday\n" +
                  "- Prioritize strong Saturday morning coverage\n" +
                  "- Don't schedule Sarah and Mike on the same day\n" +
                  "- We have 22 EPUs Wednesday, need extra coverage"
                }
                value={settings.contextPrompt}
                onChange={(e) => setSettings((s) => ({ ...s, contextPrompt: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>

            {/* Info callout */}
            <div className="anim-fade-up-4 mb-5 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800">
              <strong>How it works:</strong> When you generate a schedule with AI enabled, the algorithm
              first builds a base schedule. That schedule along with your notes above is sent to the AI,
              which returns an adjusted version saved alongside the original.
            </div>
          </>
        )}

        {/* Actions */}
        <div className="anim-fade-up-5 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="rounded-full px-6 py-2 text-sm font-semibold text-white transition"
            style={{ backgroundColor: carmaxBlue }}
          >
            {saved ? "Saved!" : "Save"}
          </button>
          <button
            onClick={handleClear}
            className="rounded-full bg-red-50 px-5 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            Clear
          </button>
          <button
            onClick={() => router.push("/")}
            className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
