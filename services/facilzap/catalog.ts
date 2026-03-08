import { cache } from "react";
import type {
  CatalogCategory,
  CatalogProduct,
  CatalogSnapshot,
} from "@/types/catalog";
import type {
  FacilzapCategoryRaw,
  FacilzapProductRaw,
  FacilzapVariationRaw,
} from "@/types/facilzap";
import { listAllPages } from "./client";

const UNKNOWN_CATEGORY_ID = "outros";
const UNKNOWN_CATEGORY_LABEL = "Outros";
const FALLBACK_PRODUCT_NAME = "Produto sem nome";
const SIZE_GROUP_HINTS = ["tamanho", "tamanhos", "numeracao", "size"];
const sizeCollator = new Intl.Collator("pt-BR", {
  numeric: true,
  sensitivity: "base",
});

type InternalCategory = CatalogCategory & {
  sortOrder: number;
  nameKey: string;
};

type InternalVariation = {
  id: string;
  nome: string | null;
  grupoNome: string | null;
  status: unknown;
  estoque: number | null;
};

type InternalVariationReference = {
  id: string | null;
  nome: string | null;
  grupoNome: string | null;
  status: unknown;
  estoque: number | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toText(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeNameKey(value: string | null) {
  if (!value) {
    return null;
  }

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseListish(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        // A FacilZap pode devolver arrays reais, strings JSON ou strings CSV
        // dependendo do endpoint e do runtime. Este parser absorve essas variacoes.
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return [parsed];
      } catch {
        return trimmed.split(",").map((item) => item.trim());
      }
    }

    if (trimmed.includes(",")) {
      return trimmed.split(",").map((item) => item.trim());
    }

    return [trimmed];
  }

  return [value];
}

function getObjectValue(
  source: Record<string, unknown>,
  keys: string[],
): unknown {
  for (const key of keys) {
    if (key in source) {
      return source[key];
    }
  }

  return undefined;
}

function pickImageUrl(value: unknown): string | null {
  const direct = toText(value);
  if (direct) {
    return direct;
  }

  if (!isRecord(value)) {
    return null;
  }

  return (
    toText(value.url) ??
    toText(value.imagem) ??
    toText(value.src) ??
    null
  );
}

function pickPrimaryImage(product: FacilzapProductRaw) {
  const direct = pickImageUrl(product.imagem);
  if (direct) {
    return direct;
  }

  const images = parseListish(product.imagens);

  const ranked = images
    .map((item) => ({
      src: pickImageUrl(item),
      priority:
        isRecord(item) && (item.principal === true || item.destaque === true)
          ? 1
          : 0,
    }))
    .filter((item) => item.src);

  ranked.sort((left, right) => right.priority - left.priority);

  return ranked[0]?.src ?? null;
}

function parseActive(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  const text = toText(value)?.toLowerCase();

  if (!text) {
    return null;
  }

  if (["1", "true", "ativo", "ativa", "sim", "enabled"].includes(text)) {
    return true;
  }

  if (["0", "false", "inativo", "inativa", "nao", "disabled"].includes(text)) {
    return false;
  }

  return null;
}

function normalizeSizeLabel(value: string | null) {
  if (!value) {
    return null;
  }

  let normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  if (/^(null|undefined|false)$/i.test(normalized)) {
    return null;
  }

  if (/^\d+(?:\.0+)?$/.test(normalized)) {
    normalized = String(Number(normalized));
  } else if (/^[a-z]{1,4}$/i.test(normalized)) {
    normalized = normalized.toUpperCase();
  } else if (/^(unico|único)$/i.test(normalized)) {
    normalized = "Unico";
  }

  return normalized;
}

function looksLikeSizeGroup(value: string | null) {
  const normalized = normalizeNameKey(value);
  if (!normalized) {
    return false;
  }

  return SIZE_GROUP_HINTS.some((hint) => normalized.includes(hint));
}

function looksLikeSizeValue(value: string | null) {
  if (!value) {
    return false;
  }

  return /^(\d{1,3}(?:\/\d{1,3})?|[A-Z]{1,4}|Unico)$/i.test(value);
}

function dedupeAndSortSizes(values: Array<string | null>) {
  const deduped = new Map<string, string>();

  for (const value of values) {
    const normalized = normalizeSizeLabel(value);

    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, normalized);
    }
  }

  return [...deduped.values()].sort((left, right) =>
    sizeCollator.compare(left, right),
  );
}

function normalizeCategory(
  raw: FacilzapCategoryRaw,
  index: number,
): InternalCategory | null {
  const id = toText(raw.id);
  const nome = toText(raw.nome);
  const key = id ?? normalizeNameKey(nome) ?? null;

  if (!key) {
    return null;
  }

  return {
    id: key,
    nome: nome ?? `Categoria ${index + 1}`,
    imagem: pickImageUrl(raw.imagem),
    sortOrder: toNumber(raw.ordem) ?? index,
    nameKey: normalizeNameKey(nome) ?? key,
  };
}

function buildCategoryLookup(categories: FacilzapCategoryRaw[]) {
  const normalized = categories
    .map(normalizeCategory)
    .filter((item): item is InternalCategory => Boolean(item));
  const byId = new Map<string, InternalCategory>();
  const byName = new Map<string, InternalCategory>();

  for (const category of normalized) {
    byId.set(category.id, category);
    byName.set(category.nameKey, category);
  }

  return { normalized, byId, byName };
}

function resolveCategory(
  product: FacilzapProductRaw,
  categories: ReturnType<typeof buildCategoryLookup>,
) {
  const categoryRefs = parseListish(product.categorias);

  for (const ref of categoryRefs) {
    if (isRecord(ref)) {
      const refId = toText(getObjectValue(ref, ["id", "categoria_id"]));
      if (refId && categories.byId.has(refId)) {
        return categories.byId.get(refId)?.id ?? UNKNOWN_CATEGORY_ID;
      }

      const refName = normalizeNameKey(
        toText(getObjectValue(ref, ["nome", "name", "categoria_nome"])),
      );
      if (refName && categories.byName.has(refName)) {
        return categories.byName.get(refName)?.id ?? UNKNOWN_CATEGORY_ID;
      }
    }

    const refText = toText(ref);
    if (refText && categories.byId.has(refText)) {
      return categories.byId.get(refText)?.id ?? UNKNOWN_CATEGORY_ID;
    }

    const refName = normalizeNameKey(refText);
    if (refName && categories.byName.has(refName)) {
      return categories.byName.get(refName)?.id ?? UNKNOWN_CATEGORY_ID;
    }
  }

  const categoryName = normalizeNameKey(toText(product.categoria_nome));
  if (categoryName && categories.byName.has(categoryName)) {
    return categories.byName.get(categoryName)?.id ?? UNKNOWN_CATEGORY_ID;
  }

  return UNKNOWN_CATEGORY_ID;
}

function normalizeVariation(raw: FacilzapVariationRaw): InternalVariation | null {
  const id = toText(raw.id);
  if (!id) {
    return null;
  }

  const grupoNome = isRecord(raw.grupo)
    ? toText(getObjectValue(raw.grupo, ["nome", "name"]))
    : null;

  return {
    id,
    nome: toText(raw.nome),
    grupoNome,
    status: raw.status,
    estoque:
      toNumber(raw.estoque) ??
      (isRecord(raw.estoque)
        ? toNumber(getObjectValue(raw.estoque, ["quantidade", "saldo", "total"]))
        : null),
  };
}

function buildVariationLookup(variations: FacilzapVariationRaw[]) {
  const map = new Map<string, InternalVariation>();

  for (const raw of variations) {
    const normalized = normalizeVariation(raw);
    if (normalized) {
      map.set(normalized.id, normalized);
    }
  }

  return map;
}

function parseVariationReferences(value: unknown): InternalVariationReference[] {
  return parseListish(value).map((item) => {
    if (isRecord(item)) {
      return {
        id: toText(getObjectValue(item, ["id", "variacao_id", "variacaoId"])),
        nome: toText(item.nome),
        grupoNome: isRecord(item.grupo)
          ? toText(getObjectValue(item.grupo, ["nome", "name"]))
          : null,
        status: getObjectValue(item, ["status", "ativo", "ativado"]),
        estoque:
          toNumber(getObjectValue(item, ["estoque", "quantidade"])) ??
          (isRecord(item.estoque)
            ? toNumber(getObjectValue(item.estoque, ["quantidade", "saldo", "total"]))
            : null),
      };
    }

    return {
      id: toText(item),
      nome: null,
      grupoNome: null,
      status: null,
      estoque: null,
    };
  });
}

function isVariationAvailable(
  reference: InternalVariationReference,
  variation: InternalVariation | undefined,
) {
  const referenceStatus = parseActive(reference.status);
  const variationStatus = parseActive(variation?.status);

  if (referenceStatus === false || variationStatus === false) {
    return false;
  }

  const stock = reference.estoque ?? variation?.estoque ?? null;
  if (stock !== null && stock <= 0) {
    return false;
  }

  return true;
}

function extractAvailableSizes(
  product: FacilzapProductRaw,
  variationLookup: Map<string, InternalVariation>,
) {
  // Se o runtime real trouxer estoque por variacao em outro formato,
  // o ajuste fino deve acontecer aqui antes da selecao final dos tamanhos.
  const references = parseVariationReferences(product.variacoes);
  const preferred: Array<string | null> = [];
  const fallback: Array<string | null> = [];

  for (const reference of references) {
    const variation = reference.id
      ? variationLookup.get(reference.id)
      : undefined;

    if (!isVariationAvailable(reference, variation)) {
      continue;
    }

    const label = normalizeSizeLabel(reference.nome ?? variation?.nome ?? null);
    const groupName = reference.grupoNome ?? variation?.grupoNome ?? null;

    if (looksLikeSizeGroup(groupName)) {
      preferred.push(label);
    } else if (looksLikeSizeValue(label)) {
      fallback.push(label);
    }
  }

  return dedupeAndSortSizes(preferred.length > 0 ? preferred : fallback);
}

function normalizeProduct(
  raw: FacilzapProductRaw,
  categoryLookup: ReturnType<typeof buildCategoryLookup>,
  variationLookup: Map<string, InternalVariation>,
): CatalogProduct | null {
  const id = toText(raw.id);
  if (!id) {
    return null;
  }

  const active = parseActive(raw.ativado ?? raw.ativo ?? raw.status);
  if (active === false) {
    return null;
  }

  return {
    id,
    nome: toText(raw.nome) ?? FALLBACK_PRODUCT_NAME,
    imagem: pickPrimaryImage(raw),
    categoria: resolveCategory(raw, categoryLookup),
    tamanhosDisponiveis: extractAvailableSizes(raw, variationLookup),
  };
}

const loadCatalogSnapshot = cache(async (): Promise<CatalogSnapshot> => {
  const [categoriesRaw, productsRaw, variationsRaw] = await Promise.all([
    listAllPages<FacilzapCategoryRaw>("/categorias", {
      tags: ["facilzap:categorias"],
      pageSize: 5000,
      maxPages: 2,
    }),
    listAllPages<FacilzapProductRaw>("/produtos", {
      tags: ["facilzap:produtos"],
      pageSize: 100,
      maxPages: 100,
    }),
    listAllPages<FacilzapVariationRaw>("/variacoes", {
      tags: ["facilzap:variacoes"],
      pageSize: 100,
      maxPages: 100,
    }),
  ]);

  const categoryLookup = buildCategoryLookup(categoriesRaw);
  const variationLookup = buildVariationLookup(variationsRaw);
  const products = productsRaw
    .map((raw) => normalizeProduct(raw, categoryLookup, variationLookup))
    .filter((item): item is CatalogProduct => Boolean(item));

  const usedCategoryIds = new Set(products.map((product) => product.categoria));
  const categories = categoryLookup.normalized
    .filter((category) => usedCategoryIds.has(category.id))
    .sort((left, right) =>
      left.sortOrder === right.sortOrder
        ? sizeCollator.compare(left.nome, right.nome)
        : left.sortOrder - right.sortOrder,
    )
    .map<CatalogCategory>(({ id, nome, imagem }) => ({ id, nome, imagem }));

  if (
    usedCategoryIds.has(UNKNOWN_CATEGORY_ID) &&
    !categories.some((category) => category.id === UNKNOWN_CATEGORY_ID)
  ) {
    categories.push({
      id: UNKNOWN_CATEGORY_ID,
      nome: UNKNOWN_CATEGORY_LABEL,
      imagem: null,
    });
  }

  console.info(
    `[catalog] normalized ${products.length} products and ${categories.length} categories`,
  );

  return { categories, products };
});

export async function getCatalogSnapshot() {
  return loadCatalogSnapshot();
}

export async function getCatalogCategories() {
  return (await loadCatalogSnapshot()).categories;
}

export async function getCatalogProducts(category = "all") {
  const { products } = await loadCatalogSnapshot();

  if (!category || category === "all") {
    return products;
  }

  return products.filter((product) => product.categoria === category);
}
