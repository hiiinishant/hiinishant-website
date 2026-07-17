// This nested layout removes the Footer for blog article pages
// so readers can focus entirely on the content.
export default function BlogSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col">
      {children}
    </div>
  );
}
