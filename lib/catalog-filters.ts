export interface CatalogFilterableProduct {
  categoria: string;
  nome: string;
  tamanhosDisponiveis: string[];
}

export interface CatalogProductFilters {
  categoria?: string | null;
  nome?: string | null;
  tamanho?: string | null;
}

const sizeCollator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base",
});

export function sanitizeFilterValue(value: string | null | undefined) {
  const sanitized = value?.replace(/\s+/g, " ").trim();
  return sanitized ? sanitized : null;
}

export function normalizeSearchText(value: string | null | undefined) {
  return (sanitizeFilterValue(value) ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function collectAvailableSizes(products: CatalogFilterableProduct[]) {
  const deduped = new Map<string, string>();

  for (const product of products) {
    for (const size of product.tamanhosDisponiveis) {
      const sanitized = sanitizeFilterValue(size);
      if (!sanitized) {
        continue;
      }

      const key = sanitized.toLowerCase();
      if (!deduped.has(key)) {
        deduped.set(key, sanitized);
      }
    }
  }

  return [...deduped.values()].sort((left, right) =>
    sizeCollator.compare(left, right),
  );
}

export function filterCatalogProducts<TProduct extends CatalogFilterableProduct>(
  products: TProduct[],
  filters: CatalogProductFilters,
) {
  let filtered = products;

  if (filters.categoria && filters.categoria !== "all") {
    filtered = filtered.filter(
      (product) => product.categoria === filters.categoria,
    );
  }

  const normalizedName = normalizeSearchText(filters.nome);
  if (normalizedName) {
    filtered = filtered.filter((product) =>
      normalizeSearchText(product.nome).includes(normalizedName),
    );
  }

  const selectedSize = sanitizeFilterValue(filters.tamanho);
  if (selectedSize) {
    filtered = filtered.filter((product) =>
      product.tamanhosDisponiveis.includes(selectedSize),
    );
  }

  return filtered;
}
