import { socialLinks } from "@/data/site";
import type { SocialPlatform } from "@/types";

const platformConfig: Record<
  SocialPlatform,
  {
    icon: React.ReactNode;
    colorClass: string;
    hoverBorderClass: string;
    hoverShadowClass: string;
    badgeBg: string;
    borderClass: string;
    followers: string;
    metricLabel: string;
  }
> = {
  twitter: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    colorClass: "bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 text-[#1DA1F2]",
    hoverBorderClass: "hover:border-[#1DA1F2]/40",
    hoverShadowClass: "hover:shadow-[0_0_30px_rgba(29,161,242,0.15)]",
    badgeBg: "bg-[#1DA1F2]",
    borderClass: "border-white/5",
    followers: "10K+",
    metricLabel: "followers",
  },
  linkedin: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    colorClass: "bg-[#0A66C2]/10 border border-[#0A66C2]/20 text-[#0A66C2]",
    hoverBorderClass: "hover:border-[#0A66C2]/40",
    hoverShadowClass: "hover:shadow-[0_0_30px_rgba(10,102,194,0.15)]",
    badgeBg: "bg-[#0A66C2]",
    borderClass: "border-white/5",
    followers: "5.01K+",
    metricLabel: "connections",
  },
  instagram: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
    colorClass: "bg-[#E1306C]/10 border border-[#E1306C]/20 text-[#E1306C]",
    hoverBorderClass: "hover:border-[#E1306C]/40",
    hoverShadowClass: "hover:shadow-[0_0_30px_rgba(225,48,108,0.15)]",
    badgeBg: "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]",
    borderClass: "border-white/5",
    followers: "500+",
    metricLabel: "followers",
  },
  youtube: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    colorClass: "bg-[#FF0000]/10 border border-[#FF0000]/20 text-[#FF0000]",
    hoverBorderClass: "hover:border-[#FF0000]/40",
    hoverShadowClass: "hover:shadow-[0_0_30px_rgba(255,0,0,0.15)]",
    badgeBg: "bg-[#FF0000]",
    borderClass: "border-white/5",
    followers: "150+",
    metricLabel: "subscribers",
  },
  telegram: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    colorClass: "bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#229ED9]",
    hoverBorderClass: "hover:border-[#229ED9]/40",
    hoverShadowClass: "hover:shadow-[0_0_30px_rgba(34,158,217,0.15)]",
    badgeBg: "bg-[#229ED9]",
    borderClass: "border-white/5",
    followers: "28.6K+",
    metricLabel: "members",
  },
  email: {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    colorClass: "bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b]",
    hoverBorderClass: "hover:border-[#f59e0b]/40",
    hoverShadowClass: "hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
    badgeBg: "bg-[#f59e0b]",
    borderClass: "border-white/5",
    followers: "2.5K+",
    metricLabel: "subscribers",
  },
  github: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
      </svg>
    ),
    colorClass: "bg-white/10 border border-white/20 text-white",
    hoverBorderClass: "hover:border-white/40",
    hoverShadowClass: "hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]",
    badgeBg: "bg-white",
    borderClass: "border-white/5",
    followers: "12+",
    metricLabel: "followers",
  },
  medium: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13.54 12a6.8 6.8 0 11-13.54 0 6.8 6.8 0 0113.54 0zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42zM23.97 12c0 3.26-.31 5.9-1.07 5.9-.76 0-1.07-2.64-1.07-5.9s.31-5.9 1.07-5.9c.76 0 1.07 2.64 1.07 5.9z" />
      </svg>
    ),
    colorClass: "bg-white/10 border border-white/20 text-white",
    hoverBorderClass: "hover:border-white/40",
    hoverShadowClass: "hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]",
    badgeBg: "bg-white",
    borderClass: "border-white/5",
    followers: "3.4K+",
    metricLabel: "followers",
  },
  quora: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14.016 19.387c-1.396.65-2.923.99-4.502.99-4.887 0-8.874-3.882-8.874-8.625S5.627 3.125 10.514 3.125s8.873 3.882 8.873 8.627c0 2.213-.865 4.23-2.298 5.766l2.36 2.373a.855.855 0 01-.131 1.328.905.905 0 01-1.127-.118l-4.175-4.714zm-3.502.261c3.55 0 6.44-2.812 6.44-6.275s-2.89-6.276-6.44-6.276-6.44 2.813-6.44 6.276 2.89 6.275 6.44 6.275zm2.936-3.864s.345.928-.27 1.545c-.613.618-1.545.271-1.545.271s.755-1.098 1.157-1.428c.403-.33.658-.388.658-.388z" />
      </svg>
    ),
    colorClass: "bg-[#B92B27]/10 border border-[#B92B27]/20 text-[#B92B27]",
    hoverBorderClass: "hover:border-[#B92B27]/40",
    hoverShadowClass: "hover:shadow-[0_0_30px_rgba(185,43,39,0.15)]",
    badgeBg: "bg-[#B92B27]",
    borderClass: "border-white/5",
    followers: "10+",
    metricLabel: "followers",
  },
  facebook: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
        <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/>
      </svg>
    ),
    colorClass: "bg-[#1877F2]/10 border border-[#1877F2]/20 text-[#1877F2]",
    hoverBorderClass: "hover:border-[#1877F2]/40",
    hoverShadowClass: "hover:shadow-[0_0_30px_rgba(24,119,242,0.15)]",
    badgeBg: "bg-[#1877F2]",
    borderClass: "border-white/5",
    followers: "5K+",
    metricLabel: "followers",
  },
  snapchat: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
        <path d="M15.943 11.526c-.111-.303-.323-.465-.564-.599a1 1 0 0 0-.123-.064l-.219-.111c-.752-.399-1.339-.902-1.746-1.498a3.4 3.4 0 0 1-.3-.531c-.034-.1-.032-.156-.008-.207a.3.3 0 0 1 .097-.1c.129-.086.262-.173.352-.231.162-.104.289-.187.371-.245.309-.216.525-.446.66-.702a1.4 1.4 0 0 0 .069-1.16c-.205-.538-.713-.872-1.329-.872a1.8 1.8 0 0 0-.487.065c.006-.368-.002-.757-.035-1.139-.116-1.344-.587-2.048-1.077-2.61a4.3 4.3 0 0 0-1.095-.881C9.764.216 8.92 0 7.999 0s-1.76.216-2.505.641c-.412.232-.782.53-1.097.883-.49.562-.96 1.267-1.077 2.61-.033.382-.04.772-.036 1.138a1.8 1.8 0 0 0-.487-.065c-.615 0-1.124.335-1.328.873a1.4 1.4 0 0 0 .067 1.161c.136.256.352.486.66.701.082.058.21.14.371.246l.339.221a.4.4 0 0 1 .109.11c.026.053.027.11-.012.217a3.4 3.4 0 0 1-.295.52c-.398.583-.968 1.077-1.696 1.472-.385.204-.786.34-.955.8-.128.348-.044.743.28 1.075q.18.189.409.31a4.4 4.4 0 0 0 1 .4.7.7 0 0 1 .202.09c.118.104.102.26.259.488q.12.178.296.3c.33.229.701.243 1.095.258.355.014.758.03 1.217.18.19.064.389.186.618.328.55.338 1.305.802 2.566.802 1.262 0 2.02-.466 2.576-.806.227-.14.424-.26.609-.321.46-.152.863-.168 1.218-.181.393-.015.764-.03 1.095-.258a1.14 1.14 0 0 0 .336-.368c.114-.192.11-.327.217-.42a.6.6 0 0 1 .19-.087 4.5 4.5 0 0 0 1.014-.404c.16-.087.306-.2.429-.336l.004-.005c.304-.325.38-.709.256-1.047m-1.121.602c-.684.378-1.139.337-1.493.565-.3.193-.122.61-.34.76-.269.186-1.061-.012-2.085.326-.845.279-1.384 1.082-2.903 1.082s-2.045-.801-2.904-1.084c-1.022-.338-1.816-.14-2.084-.325-.218-.15-.041-.568-.341-.761-.354-.228-.809-.187-1.492-.563-.436-.24-.189-.39-.044-.46 2.478-1.199 2.873-3.05 2.89-3.188.022-.166.045-.297-.138-.466-.177-.164-.962-.65-1.18-.802-.36-.252-.52-.503-.402-.812.082-.214.281-.295.49-.295a1 1 0 0 1 .197.022c.396.086.78.285 1.002.338q.04.01.082.011c.118 0 .16-.06.152-.195-.026-.433-.087-1.277-.019-2.066.094-1.084.444-1.622.859-2.097.2-.229 1.137-1.22 2.93-1.22 1.792 0 2.732.987 2.931 1.215.416.475.766 1.013.859 2.098.068.788.009 1.632-.019 2.065-.01.142.034.195.152.195a.4.4 0 0 0 .082-.01c.222-.054.607-.253 1.002-.338a1 1 0 0 1 .197-.023c.21 0 .409.082.49.295.117.309-.04.56-.401.812-.218.152-1.003.638-1.18.802-.184.169-.16.3-.139.466.018.14.413 1.991 2.89 3.189.147.073.394.222-.041.464"/>
      </svg>
    ),
    colorClass: "bg-[#FFFC00]/10 border border-[#FFFC00]/20 text-[#FFFC00]",
    hoverBorderClass: "hover:border-[#FFFC00]/40",
    hoverShadowClass: "hover:shadow-[0_0_30px_rgba(255,252,0,0.15)]",
    badgeBg: "bg-[#FFFC00] text-black",
    borderClass: "border-white/5",
    followers: "2K+",
    metricLabel: "followers",
  },
};

export default function SocialSection() {
  return (
    <section id="social" className="py-16 lg:py-24 relative overflow-hidden bg-brand-900/10">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-emerald-500/3 rounded-full blur-3xl pointer-events-none animate-float" />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
        <div className="text-center mb-16">
          {/* Pulsing Live Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border-white/5 mb-4 animate-float">
            <span className="relative flex h-2 w-2">
              <span className="animate-live-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold tracking-wider text-emerald-400 uppercase">
              Command Center Active
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-gradient-white">
            Social <span className="text-gradient">Media</span>
          </h1>
          <p className="text-brand-300 max-w-xl mx-auto text-base sm:text-lg">
            Nishant Kumar's presence across platforms, creator networks, and community channels.
          </p>
        </div>

        {/* Brand Command Center Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {socialLinks.map((link) => {
            const config = platformConfig[link.platform];
            if (!config) return null;

            return (
              <a
                key={link.platform}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 p-6 flex flex-col justify-between h-[185px] bg-brand-900/40 hover:-translate-y-1 ${config.borderClass} ${config.hoverBorderClass} ${config.hoverShadowClass}`}
              >
                {/* Decorative glow background */}
                <div className={`absolute -right-10 -top-10 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl ${config.badgeBg}`} />

                {/* Shimmer sweep effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer pointer-events-none" />

                {/* Top Section */}
                <div className="flex justify-between items-start z-10">
                  <div className="flex items-center gap-3">
                    {/* Icon Wrapper */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${config.colorClass}`}>
                      {config.icon}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider block">
                        {link.label}
                      </span>
                      <span className="text-xs text-brand-300 font-mono">
                        {link.handle}
                      </span>
                    </div>
                  </div>

                  {/* Action Arrow */}
                  <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-brand-400 group-hover:text-white group-hover:border-white/20 transition-all duration-300 group-hover:translate-x-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>

                {/* Middle/Bottom Section */}
                <div className="mt-4 z-10">
                  {/* Description */}
                  <p className="text-xs text-brand-400 line-clamp-2 mb-3 group-hover:text-brand-300 transition-colors">
                    {link.description}
                  </p>

                  {/* Metric / Follower Count */}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold tracking-tight text-white group-hover:text-gradient transition-all duration-300 font-mono">
                      {config.followers}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-brand-500 tracking-wider">
                      {config.metricLabel}
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
