"use client";

export default function AuroraBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Aurora wave 1 — amber/gold */}
      <div
        className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-[0.12]"
        style={{
          background:
            "radial-gradient(ellipse at center, #f59e0b 0%, #fbbf24 40%, transparent 70%)",
          filter: "blur(80px)",
          animation: "auroraFloat1 12s ease-in-out infinite",
        }}
      />
      {/* Aurora wave 2 — blue/indigo */}
      <div
        className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.08]"
        style={{
          background:
            "radial-gradient(ellipse at center, #6366f1 0%, #3b82f6 50%, transparent 70%)",
          filter: "blur(90px)",
          animation: "auroraFloat2 16s ease-in-out infinite",
        }}
      />
      {/* Aurora wave 3 — emerald/teal */}
      <div
        className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.06]"
        style={{
          background:
            "radial-gradient(ellipse at center, #10b981 0%, #06b6d4 50%, transparent 70%)",
          filter: "blur(100px)",
          animation: "auroraFloat3 20s ease-in-out infinite",
        }}
      />
      {/* Aurora wave 4 — rose/pink highlight */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-[0.04]"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at center, #f43f5e 0%, #a855f7 50%, transparent 70%)",
          filter: "blur(80px)",
          animation: "auroraFloat2 24s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}
