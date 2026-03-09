import { collectAvailableSizes, filterCatalogProducts, sanitizeFilterValue } from "@/lib/catalog-filters";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogNotice } from "@/components/catalog/CatalogNotice";
import { CategoryTabs } from "@/components/catalog/CategoryTabs";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { FacilzapConfigError } from "@/lib/env";
import { getCatalogSnapshot } from "@/services/facilzap/catalog";

type HomePageProps = {
  searchParams: Promise<{
    categoria?: string | string[] | undefined;
    nome?: string | string[] | undefined;
    tamanho?: string | string[] | undefined;
  }>;
};

function readCategoryParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "all";
  }

  return value ?? "all";
}

function readFilterParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return sanitizeFilterValue(value[0]);
  }

  return sanitizeFilterValue(value);
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const requestedCategory = readCategoryParam(params.categoria);
  const currentName = readFilterParam(params.nome) ?? "";
  const requestedSize = readFilterParam(params.tamanho);

  try {
    const snapshot = await getCatalogSnapshot();
    const selectedCategory = snapshot.categories.some(
      (category) => category.id === requestedCategory,
    )
      ? requestedCategory
      : "all";
    const selectedCategoryName =
      snapshot.categories.find((category) => category.id === selectedCategory)
        ?.nome ?? "Todas";
    const categoryProducts =
      selectedCategory === "all"
        ? snapshot.products
        : snapshot.products.filter(
            (product) => product.categoria === selectedCategory,
          );
    const availableSizes = collectAvailableSizes(categoryProducts);
    const selectedSize =
      requestedSize && availableSizes.includes(requestedSize)
        ? requestedSize
        : null;
    const products = filterCatalogProducts(categoryProducts, {
      nome: currentName,
      tamanho: selectedSize,
    });
    const hasActiveFilters = Boolean(currentName || selectedSize);
    const emptyTitle = hasActiveFilters
      ? "Nenhum produto encontrado com os filtros atuais"
      : "Nenhum produto encontrado";
    const emptyDescription = hasActiveFilters
      ? "Nao encontramos itens para a combinacao atual de categoria, nome e tamanho. Ajuste ou limpe os filtros para continuar navegando."
      : "Nao ha itens para a categoria selecionada no momento. Tente outra categoria ou volte em alguns minutos.";

    return (
      <div className="catalog-shell min-h-screen">
        <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/65 px-6 py-8 shadow-[var(--shadow)] sm:px-8 sm:py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted">
              Catalogo publico
            </p>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
              <div>
                <h1 className="max-w-3xl font-display text-5xl leading-none text-ink sm:text-6xl">
                  Catalogo Digital
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-muted sm:text-base">
                  Navegue por categorias, veja a foto principal de cada produto
                  e consulte apenas os tamanhos disponiveis. O catalogo e
                  atualizado automaticamente com novas entradas da API.
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-4 rounded-[1.75rem] border border-white/60 bg-panel p-5">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                    Categorias
                  </dt>
                  <dd className="mt-2 font-display text-3xl text-ink">
                    {snapshot.categories.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                    Produtos
                  </dt>
                  <dd className="mt-2 font-display text-3xl text-ink">
                    {snapshot.products.length}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <CategoryTabs
            categories={snapshot.categories}
            selectedCategory={selectedCategory}
            currentName={currentName}
            currentSize={selectedSize}
          />

          <CatalogFilters
            currentName={currentName}
            currentSize={selectedSize}
            availableSizes={availableSizes}
          />

          {products.length === 0 ? (
            <CatalogNotice
              title={emptyTitle}
              description={emptyDescription}
            />
          ) : (
            <ProductGrid
              products={products}
              selectedCategoryName={selectedCategoryName}
            />
          )}
        </main>
      </div>
    );
  } catch (error) {
    if (error instanceof FacilzapConfigError) {
      return (
        <div className="catalog-shell min-h-screen">
          <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-8">
            <CatalogNotice
              title="Configuracao pendente"
              description="Defina FACILZAP_TOKEN e FACILZAP_API_BASE_URL para carregar o catalogo. O token deve ser configurado apenas no servidor."
              tone="warning"
            />
          </main>
        </div>
      );
    }

    console.error("[catalog] failed to render page", error);

    return (
      <div className="catalog-shell min-h-screen">
        <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-8">
          <CatalogNotice
            title="Catalogo temporariamente indisponivel"
            description="Nao foi possivel carregar os produtos agora. Tente novamente em alguns instantes."
            tone="error"
          />
        </main>
      </div>
    );
  }
}
