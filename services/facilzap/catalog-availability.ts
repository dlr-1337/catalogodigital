type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [parsed];
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

function getObjectValue(source: UnknownRecord, keys: string[]) {
  for (const key of keys) {
    if (key in source) {
      return source[key];
    }
  }

  return undefined;
}

function parseActive(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      return null;
    }

    if (["1", "true", "ativo", "ativa", "ativado", "ativada", "sim"].includes(normalized)) {
      return true;
    }

    if (["0", "false", "inativo", "inativa", "desativado", "desativada", "nao"].includes(normalized)) {
      return false;
    }
  }

  return null;
}

function readKnownStock(value: unknown) {
  const direct = toNumber(value);
  if (direct !== null) {
    return {
      known: true,
      value: direct,
    };
  }

  if (!isRecord(value)) {
    return {
      known: false,
      value: null,
    };
  }

  const nested = toNumber(
    getObjectValue(value, ["estoque", "quantidade", "saldo", "total"]),
  );

  return {
    known: nested !== null,
    value: nested,
  };
}

function readVariationStatus(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  return parseActive(
    getObjectValue(value, ["status", "ativo", "ativado", "ativada"]),
  );
}

function readVariationStock(value: unknown) {
  if (!isRecord(value)) {
    return {
      known: false,
      value: null,
    };
  }

  const topLevel = toNumber(
    getObjectValue(value, ["estoque", "quantidade", "saldo", "total"]),
  );
  if (topLevel !== null) {
    return {
      known: true,
      value: topLevel,
    };
  }

  return readKnownStock(value.estoque);
}

function readProductControlledStock(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  return parseActive(
    getObjectValue(value, ["controlar_estoque", "controla_estoque"]),
  );
}

function isProductAvailableFromOwnStock(value: unknown) {
  const stock = readKnownStock(value);
  const controlled = readProductControlledStock(value);

  if (stock.known && stock.value !== null) {
    if (stock.value > 0) {
      return true;
    }

    if (controlled === true) {
      return false;
    }
  }

  return true;
}

export function isCatalogProductAvailable(product: UnknownRecord) {
  const productStatus = parseActive(
    product.ativado ?? product.ativo ?? product.status,
  );

  if (productStatus === false) {
    return false;
  }

  const variations = parseListish(product.variacoes);

  if (variations.length > 0) {
    let hasKnownAvailabilitySignal = false;
    let hasActiveVariationWithoutReliableStock = false;

    for (const variation of variations) {
      const variationStatus = readVariationStatus(variation);

      if (variationStatus === false) {
        hasKnownAvailabilitySignal = true;
        continue;
      }

      const variationStock = readVariationStock(variation);

      if (variationStock.known && variationStock.value !== null) {
        hasKnownAvailabilitySignal = true;

        if (variationStock.value > 0) {
          return true;
        }

        continue;
      }

      hasActiveVariationWithoutReliableStock = true;
    }

    if (hasActiveVariationWithoutReliableStock) {
      return true;
    }

    if (hasKnownAvailabilitySignal) {
      return false;
    }
  }

  return isProductAvailableFromOwnStock(product.estoque);
}
