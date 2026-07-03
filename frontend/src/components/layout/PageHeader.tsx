interface PageHeaderProps {
  label: string;
  title: React.ReactNode;
  description?: string;
}

export default function PageHeader({ label, title, description }: PageHeaderProps) {
  return (
    <section className="relative py-4 lg:py-6 overflow-hidden noise">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-accent/8 blur-[120px]"></div>
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center relative z-10">
        <span className="text-xs font-semibold text-accent uppercase tracking-widest mb-6 block">
          {label}
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          {title}
        </h1>
        {description && (
          <p className="text-lg sm:text-xl text-brand-300 max-w-2xl mx-auto font-light leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
