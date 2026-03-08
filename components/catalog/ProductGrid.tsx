import type { CatalogProduct } from "@/types/catalog";
import { ProductCard } from "./ProductCard";

type ProductGridProps = {
  products: CatalogProduct[];
  selectedCategoryName: string;
};

export function ProductGrid({
  products,
  selectedCategoryName,
}: ProductGridProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
            Categoria selecionada
          </p>
          <h2 className="mt-2 font-display text-3xl text-ink">
            {selectedCategoryName}
          </h2>
        </div>
        <p className="text-sm text-muted">
          {products.length} {products.length === 1 ? "item" : "itens"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
