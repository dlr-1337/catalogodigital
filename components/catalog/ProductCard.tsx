import type { CatalogProduct } from "@/types/catalog";
import { ProductImage } from "./ProductImage";

type ProductCardProps = {
  product: CatalogProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  const sizes =
    product.tamanhosDisponiveis.length > 0
      ? product.tamanhosDisponiveis.join(" | ")
      : null;

  return (
    <article className="group rounded-[1.75rem] border border-white/65 bg-panel p-3 shadow-[0_20px_55px_rgba(46,31,18,0.08)]">
      <ProductImage src={product.imagem} alt={product.nome} />
      <div className="px-1 pb-2 pt-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-ink sm:text-base">
          {product.nome}
        </h3>
        {sizes ? (
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.24em] text-muted sm:text-[0.78rem]">
            {sizes}
          </p>
        ) : null}
      </div>
    </article>
  );
}
