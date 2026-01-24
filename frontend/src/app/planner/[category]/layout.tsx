// Generate static params for all category pages at build time
export function generateStaticParams() {
  return [
    { category: 'beef' },
    { category: 'poultry' },
    { category: 'pork' },
    { category: 'fish' },
    { category: 'vegetables' },
    { category: 'fruits' },
    { category: 'grains' },
    { category: 'dairy' },
    { category: 'legumes' },
  ];
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
