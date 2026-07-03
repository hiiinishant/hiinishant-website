import Link from "next/link";
import { journey } from "@/data/journey";

export default function JourneySection() {
  return (
    <section id="journey" className="py-20 lg:py-28 relative overflow-hidden">
      {styleBlock}

      {/* Background Aurora */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{
            background: "radial-gradient(ellipse, #f59e0b 0%, #6366f1 50%, transparent 70%)",
            filter: "blur(100px)",
            animation: "floatSlow 18s ease-in-out infinite",
          }}
        />
      </div>

      {/* Floating Fireflies Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, idx) => {
          const size = Math.random() * 4 + 2;
          const left = Math.random() * 90 + 5;
          const delay = Math.random() * 10;
          const duration = Math.random() * 15 + 10;
          return (
            <div
              key={idx}
              className="absolute rounded-full bg-emerald-400/35 blur-[1px] firefly-particle"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                top: `-20px`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            />
          );
        })}
      </div>

      {/* Faint Nature Foliage/Tree silhouette in the background */}
      <div className="absolute inset-y-0 left-0 right-0 pointer-events-none z-0 opacity-[0.03] flex justify-between items-center px-4 overflow-hidden">
        {/* Left Tree Branch SVG */}
        <svg className="w-96 h-96 -translate-x-10 text-white fill-current" viewBox="0 0 100 100">
          <path d="M0,0 C20,10 40,5 50,25 C60,45 45,70 80,75 C90,77 95,85 100,90 L100,100 L0,100 Z" />
          <circle cx="30" cy="15" r="3" />
          <circle cx="45" cy="35" r="4" />
          <circle cx="65" cy="55" r="5" />
        </svg>
        {/* Right Tree Branch SVG */}
        <svg className="w-96 h-96 translate-x-10 text-white fill-current transform scale-x-[-1]" viewBox="0 0 100 100">
          <path d="M0,0 C20,10 40,5 50,25 C60,45 45,70 80,75 C90,77 95,85 100,90 L100,100 L0,100 Z" />
          <circle cx="30" cy="15" r="3" />
          <circle cx="45" cy="35" r="4" />
          <circle cx="65" cy="55" r="5" />
        </svg>
      </div>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-[11px] font-bold text-accent uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            The Full Story
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
            Chronological <span className="text-gradient">Timeline</span>
          </h1>
          <p className="text-brand-400 text-sm mt-4 max-w-xl mx-auto">
            From 2003 to now — every milestone that shaped Nishant Kumar into who he is today.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Central spine (Trunk) with gradient and vine overlay */}
          <div className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 overflow-hidden">
            <div
              className="h-full w-full"
              style={{
                background: "linear-gradient(to bottom, transparent 0%, #f59e0b 10%, #6366f1 40%, #10b981 70%, #f59e0b 90%, transparent 100%)",
                opacity: 0.4,
              }}
            />
          </div>

          {/* Organic Climbing Vine overlay on the trunk */}
          <div className="absolute left-4 md:left-1/2 md:-translate-x-[2px] top-0 bottom-0 w-[4px] pointer-events-none z-10 opacity-70">
            <svg className="h-full w-full text-emerald-500/40 fill-none" preserveAspectRatio="none" viewBox="0 0 10 1000">
              <path
                d="M5,0 Q8,50 2,100 T5,200 T8,300 T2,400 T5,500 T8,600 T2,700 T5,800 T8,900 T5,1000"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <div className="space-y-12">
            {journey.map((item, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div
                  key={item.year}
                  className={`relative flex items-center gap-0 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  {/* Branch Connector with Swaying Leaf */}
                  <div
                    className={`hidden md:block absolute top-1/2 -translate-y-1/2 h-px z-0 ${
                      isLeft ? "left-[46%] right-[50%]" : "left-[50%] right-[46%]"
                    } bg-gradient-to-r from-emerald-600/10 via-emerald-600/35 to-emerald-600/10`}
                  >
                    <span
                      className={`absolute left-1/2 top-[-10px] -translate-x-1/2 text-sm select-none pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity ${
                        isLeft ? "animate-sway-leaf" : "animate-sway-leaf-rev"
                      }`}
                    >
                      🍃
                    </span>
                  </div>

                  {/* Timeline dot */}
                  <div
                    className={`absolute left-4 md:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center text-xl z-20 transition-all duration-300 hover:scale-125 border-2 border-background ${item.dot} shadow-[0_0_15px_rgba(16,185,129,0.2)]`}
                  >
                    {item.emoji}
                  </div>

                  {/* Original Card design and colors */}
                  <div className={`ml-16 md:ml-0 md:w-[46%] group ${isLeft ? "md:mr-[8%] md:pr-2" : "md:ml-[8%] md:pl-2"}`}>
                    <div
                      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${item.color} ${item.border} p-6 transition-all duration-400 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.35)] card-spotlight`}
                      style={{ backdropFilter: "blur(16px)" }}
                    >
                      {/* Shimmer on hover */}
                      <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer pointer-events-none" />

                      {/* Faint leaf background pattern in each card on hover */}
                      <div className="absolute bottom-2 right-2 w-12 h-12 text-emerald-500/5 group-hover:text-emerald-500/15 pointer-events-none transition-all duration-500 transform group-hover:scale-125 select-none">
                        🌿
                      </div>

                      {/* Latest badge */}
                      {item.isLatest && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/15 border border-accent/30 mb-3">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-live-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
                          </span>
                          <span className="text-[9px] font-bold text-accent uppercase tracking-wider">Live — Now</span>
                        </div>
                      )}

                      <div className={`font-black font-mono text-sm mb-1 ${item.accent}`}>{item.year}</div>
                      <h3 className={`text-lg font-extrabold text-white mb-2 group-hover:${item.accent} transition-colors`}>
                        {item.title}
                      </h3>
                      <p className="text-brand-400 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  {/* Spacer for opposite side */}
                  <div className="hidden md:block md:w-[46%]" />
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <p className="text-brand-400 text-sm mb-6 italic">The journey continues — the best chapters are still being written.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl glass-strong text-white font-semibold hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5 group border border-white/5 hover:border-accent/30"
          >
            Connect with Nishant
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

const styleBlock = (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes sway {
      0%, 100% { transform: rotate(15deg) scale(1); }
      50% { transform: rotate(25deg) scale(1.15); }
    }
    @keyframes swayReverse {
      0%, 100% { transform: rotate(-15deg) scale(1); }
      50% { transform: rotate(-25deg) scale(1.15); }
    }
    @keyframes firefly {
      0% {
        transform: translateY(100vh) translateX(0) scale(0.5);
        opacity: 0;
      }
      10% {
        opacity: 0.6;
      }
      90% {
        opacity: 0.6;
      }
      100% {
        transform: translateY(-10vh) translateX(50px) scale(1);
        opacity: 0;
      }
    }
    @keyframes floatSlow {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-8px) rotate(2deg); }
    }
    .animate-sway-leaf {
      animation: sway 4s ease-in-out infinite;
      transform-origin: bottom left;
    }
    .animate-sway-leaf-rev {
      animation: swayReverse 4s ease-in-out infinite;
      transform-origin: bottom right;
    }
    .firefly-particle {
      animation: firefly linear infinite;
    }
  ` }} />
);
