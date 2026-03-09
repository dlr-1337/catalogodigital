"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { sanitizeFilterValue } from "@/lib/catalog-filters";

type CatalogFiltersProps = {
  currentName: string;
  currentSize: string | null;
  availableSizes: string[];
};

function buildCatalogHref(
  pathname: string,
  searchParams: string,
  updates: Record<string, string | null | undefined>,
) {
  const nextParams = new URLSearchParams(searchParams);

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      continue;
    }

    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
  }

  const query = nextParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function CatalogFilters({
  currentName,
  currentSize,
  availableSizes,
}: CatalogFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nameValue, setNameValue] = useState(currentName);
  const [sizeValue, setSizeValue] = useState(currentSize ?? "");

  useEffect(() => {
    setNameValue(currentName);
  }, [currentName]);

  useEffect(() => {
    setSizeValue(currentSize ?? "");
  }, [currentSize]);

  function syncUrl(updates: Record<string, string | null | undefined>) {
    const currentSearch = searchParams.toString();
    const nextHref = buildCatalogHref(pathname, currentSearch, updates);
    const currentHref = currentSearch ? `${pathname}?${currentSearch}` : pathname;

    if (nextHref === currentHref) {
      return;
    }

    startTransition(() => {
      router.replace(nextHref, { scroll: false });
    });
  }

  const syncUrlEffect = useEffectEvent(syncUrl);

  useEffect(() => {
    const requestedName = sanitizeFilterValue(searchParams.get("nome"));
    if (requestedName !== (currentName || null)) {
      syncUrlEffect({ nome: currentName || null });
    }
  }, [currentName, searchParams]);

  useEffect(() => {
    const requestedSize = sanitizeFilterValue(searchParams.get("tamanho"));
    if (requestedSize !== currentSize) {
      syncUrlEffect({ tamanho: currentSize });
    }
  }, [currentSize, searchParams]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextName = sanitizeFilterValue(nameValue);
      if (nextName === (currentName || null)) {
        return;
      }

      syncUrlEffect({ nome: nextName });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [currentName, nameValue]);

  const hasLocalFilters = Boolean(sanitizeFilterValue(nameValue) || sizeValue);

  return (
    <section
      aria-label="Filtros do catalogo"
      className="rounded-[1.75rem] border border-white/55 bg-white/70 p-4 shadow-[0_18px_60px_rgba(42,30,20,0.08)] backdrop-blur-xl sm:p-5"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.7fr)_auto] lg:items-end">
        <div className="space-y-2">
          <label
            htmlFor="catalog-filter-name"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-muted"
          >
            Nome
          </label>
          <input
            id="catalog-filter-name"
            name="nome"
            type="search"
            value={nameValue}
            onChange={(event) => setNameValue(event.target.value)}
            placeholder="Buscar por nome do produto"
            className="w-full rounded-[1.1rem] border border-line bg-panel px-4 py-3 text-sm text-ink outline-none ring-0 placeholder:text-muted/80 focus:border-accent"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="catalog-filter-size"
            className="text-xs font-semibold uppercase tracking-[0.24em] text-muted"
          >
            Tamanho
          </label>
          <select
            id="catalog-filter-size"
            name="tamanho"
            value={sizeValue}
            onChange={(event) => {
              const nextSize = event.target.value;
              setSizeValue(nextSize);
              syncUrl({ tamanho: nextSize || null });
            }}
            className="w-full rounded-[1.1rem] border border-line bg-panel px-4 py-3 text-sm text-ink outline-none focus:border-accent"
          >
            <option value="">Todos os tamanhos</option>
            {availableSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setNameValue("");
            setSizeValue("");
            syncUrl({ nome: null, tamanho: null });
          }}
          disabled={!hasLocalFilters}
          className="rounded-full border border-line bg-panel px-5 py-3 text-sm font-semibold text-muted disabled:cursor-not-allowed disabled:opacity-60 enabled:hover:border-accent enabled:hover:text-accent"
        >
          Limpar filtros
        </button>
      </div>
    </section>
  );
}
