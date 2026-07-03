export interface JourneyItem {
  year: string;
  title: string;
  emoji: string;
  side: "left" | "right";
  color: string;
  accent: string;
  border: string;
  dot: string;
  description: string;
  isLatest?: boolean;
}

export const journey: JourneyItem[] = [
  {
    year: "2003",
    title: "Born Curious",
    emoji: "👶",
    side: "left",
    color: "from-violet-500/20 to-violet-500/5",
    accent: "text-violet-400",
    border: "border-violet-500/20 hover:border-violet-500/40",
    dot: "bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.8)]",
    description:
      "Born in India with an innate curiosity for how things work. From a young age, questions about technology, mathematics, and the world came naturally.",
  },
  {
    year: "2010–2015",
    title: "School Days & First Code",
    emoji: "🖥️",
    side: "right",
    color: "from-sky-500/20 to-sky-500/5",
    accent: "text-sky-400",
    border: "border-sky-500/20 hover:border-sky-500/40",
    dot: "bg-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.8)]",
    description:
      "Discovered computers and wrote first lines of code in school. Fell in love with problem-solving and the idea that software could change the world.",
  },
  {
    year: "2018",
    title: "Engineering Begins",
    emoji: "⚙️",
    side: "left",
    color: "from-emerald-500/20 to-emerald-500/5",
    accent: "text-emerald-400",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    dot: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]",
    description:
      "Stepped into engineering college — diving deep into Computer Science fundamentals, algorithms, operating systems, and system design.",
  },
  {
    year: "2020",
    title: "The 2 AM Spark",
    emoji: "✨",
    side: "right",
    color: "from-amber-500/20 to-amber-500/5",
    accent: "text-amber-400",
    border: "border-amber-500/20 hover:border-amber-500/40",
    dot: "bg-accent shadow-[0_0_14px_rgba(245,158,11,0.9)]",
    description:
      "Started creating handwritten notes and sharing them during late-night study sessions. What began as helping a few friends turned into a Telegram group of thousands.",
  },
  {
    year: "2021",
    title: "Growing a Community",
    emoji: "🌱",
    side: "left",
    color: "from-teal-500/20 to-teal-500/5",
    accent: "text-teal-400",
    border: "border-teal-500/20 hover:border-teal-500/40",
    dot: "bg-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.8)]",
    description:
      "Built an organic community of dedicated learners across social media, reaching 10K+ students within months purely through word-of-mouth and consistent content.",
  },
  {
    year: "2022",
    title: "2 AM Study is Born",
    emoji: "🚀",
    side: "right",
    color: "from-orange-500/20 to-orange-500/5",
    accent: "text-orange-400",
    border: "border-orange-500/20 hover:border-orange-500/40",
    dot: "bg-orange-500 shadow-[0_0_14px_rgba(249,115,22,0.9)]",
    description:
      "Officially launched 2 AM Study as a full-fledged edtech platform — curated courses, study materials, a student store, and resources that students actually needed.",
  },
  {
    year: "2023",
    title: "Building in Public",
    emoji: "📡",
    side: "left",
    color: "from-pink-500/20 to-pink-500/5",
    accent: "text-pink-400",
    border: "border-pink-500/20 hover:border-pink-500/40",
    dot: "bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.8)]",
    description:
      "Committed to radical transparency — sharing wins, failures, revenue milestones, and lessons learned weekly across all platforms. Building trust one post at a time.",
  },
  {
    year: "2024",
    title: "Scaling Impact",
    emoji: "⚡",
    side: "right",
    color: "from-yellow-500/20 to-yellow-500/5",
    accent: "text-yellow-400",
    border: "border-yellow-500/20 hover:border-yellow-500/40",
    dot: "bg-yellow-400 shadow-[0_0_14px_rgba(250,204,21,0.9)]",
    description:
      "Surpassed 100K+ students, expanded the team, launched flagship digital products, and set the foundation for a nationwide learning platform.",
  },
  {
    year: "2025–Now",
    title: "GATE & Next Chapter",
    emoji: "🎯",
    side: "left",
    color: "from-accent/20 to-accent/5",
    accent: "text-accent",
    border: "border-accent/30 hover:border-accent/60",
    dot: "bg-accent shadow-[0_0_18px_rgba(245,158,11,1)]",
    description:
      "Preparing for GATE CSE while continuing to scale 2 AM Study. Building hiiinishant.com as a premium personal brand. The best chapters are still being written.",
    isLatest: true,
  },
];
