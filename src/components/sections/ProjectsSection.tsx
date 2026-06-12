import Link from "next/link";
import { projects } from "@/data/projects";

const projectIcons: Record<string, React.ReactNode> = {
  "2am-study": (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  "student-store": (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  "gate-cse": (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
};

const projectTheme: Record<string, { border: string; iconBg: string; text: string; shadow: string }> = {
  "2am-study": {
    border: "group-hover:border-accent/30",
    iconBg: "bg-accent/10 text-accent",
    text: "group-hover:text-accent",
    shadow: "hover:shadow-[0_0_30px_rgba(245,158,11,0.12)]",
  },
  "student-store": {
    border: "group-hover:border-emerald-500/30",
    iconBg: "bg-emerald-500/10 text-emerald-400",
    text: "group-hover:text-emerald-400",
    shadow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]",
  },
  "gate-cse": {
    border: "group-hover:border-indigo-500/30",
    iconBg: "bg-indigo-500/10 text-indigo-400",
    text: "group-hover:text-indigo-400",
    shadow: "hover:shadow-[0_0_30px_rgba(99,102,241,0.12)]",
  },
};

export default function ProjectsSection() {
  return (
    <section id="projects" className="py-10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => {
            const theme = projectTheme[project.id] || projectTheme["2am-study"];
            const icon = projectIcons[project.id] || projectIcons["2am-study"];

            return (
              <div
                key={project.id}
                className={`group p-8 rounded-2xl glass hover:glass-strong transition-all duration-500 hover:-translate-y-1 border border-white/5 ${theme.border} ${theme.shadow}`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${theme.iconBg}`}>
                    {icon}
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold text-white transition-colors ${theme.text}`}>
                      {project.name}
                    </h3>
                    <p className="text-sm text-brand-400 mt-0.5">{project.tagline}</p>
                  </div>
                </div>
                <p className="text-sm text-brand-400 leading-relaxed mb-5">
                  {project.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-lg bg-white/5 text-xs text-brand-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-brand-500 shrink-0 ml-4">{project.year}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-white/5">
                  {project.website && (
                    <a
                      href={project.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-semibold text-brand-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
                    >
                      Website
                      <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  {project.youtube && (
                    <a
                      href={project.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-semibold text-brand-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
                    >
                      YouTube
                      <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </a>
                  )}
                  {project.instagram && (
                    <a
                      href={project.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-semibold text-brand-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
                    >
                      Instagram
                      <svg className="w-3 h-3 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>


      </div>
    </section>
  );
}
