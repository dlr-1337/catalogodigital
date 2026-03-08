import Link from "next/link";
import type { CatalogCategory } from "@/types/catalog";

type CategoryTabsProps = {
  categories: CatalogCategory[];
  selectedCategory: string;
};

export function CategoryTabs({
  categories,
  selectedCategory,
}: CategoryTabsProps) {
  if (categories.length === 0) {
    return null;
  }

  const items = [{ id: "all", nome: "Todas" }, ...categories];

  return (
    <nav
      aria-label="Categorias do catalogo"
      className="sticky top-0 z-20 -mx-4 overflow-hidden rounded-[1.75rem] border border-white/55 bg-white/70 px-4 py-4 shadow-[0_18px_60px_rgba(42,30,20,0.08)] backdrop-blur-xl sm:mx-0"
    >
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((category) => {
          const isActive = selectedCategory === category.id;
          const href =
            category.id === "all"
              ? "/"
              : `/?categoria=${encodeURIComponent(category.id)}`;

          return (
            <Link
              key={category.id}
              href={href}
              scroll={false}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
                isActive
                  ? "border-accent bg-accent text-white shadow-lg"
                  : "border-line bg-panel text-muted hover:border-accent hover:text-accent"
              }`}
            >
              {category.nome}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
