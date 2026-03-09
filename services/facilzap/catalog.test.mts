import assert from "node:assert/strict";
import test from "node:test";

import { isCatalogProductAvailable } from "./catalog-availability.ts";

function createProduct(overrides = {}) {
  return {
    id: 1,
    nome: "Produto teste",
    ativado: true,
    categorias: [374044],
    estoque: {
      controlar_estoque: true,
    },
    variacoes: [
      {
        id: 11,
        nome: "35",
        ativada: true,
        estoque: {
          estoque: 2,
        },
      },
    ],
    ...overrides,
  };
}

test("mantem produto visivel quando existe variacao ativa com estoque positivo", () => {
  assert.equal(isCatalogProductAvailable(createProduct()), true);
});

test("remove produto quando todas as variacoes estao zeradas", () => {
  const product = createProduct({
    variacoes: [
      {
        id: 11,
        nome: "35",
        ativada: true,
        estoque: {
          estoque: 0,
        },
      },
      {
        id: 12,
        nome: "36",
        ativada: true,
        estoque: {
          estoque: 0,
        },
      },
    ],
  });

  assert.equal(isCatalogProductAvailable(product), false);
});

test("remove produto quando todas as variacoes estao desativadas", () => {
  const product = createProduct({
    variacoes: [
      {
        id: 11,
        nome: "35",
        ativada: false,
        estoque: {
          estoque: 3,
        },
      },
      {
        id: 12,
        nome: "36",
        ativada: false,
        estoque: {
          estoque: 2,
        },
      },
    ],
  });

  assert.equal(isCatalogProductAvailable(product), false);
});

test("remove produto sem variacoes quando o estoque do produto e zero e controlado", () => {
  const product = createProduct({
    variacoes: [],
    estoque: {
      controlar_estoque: true,
      estoque: 0,
    },
  });

  assert.equal(isCatalogProductAvailable(product), false);
});

test("mantem produto sem variacoes visivel quando o estoque nao e legivel", () => {
  const product = createProduct({
    variacoes: [],
    estoque: {
      controlar_estoque: true,
    },
  });

  assert.equal(isCatalogProductAvailable(product), true);
});

test("mantem produto visivel quando existe variacao ativa sem estoque confiavel", () => {
  const product = createProduct({
    variacoes: [
      {
        id: 11,
        nome: "35",
        ativada: true,
        estoque: {
          estoque: 0,
        },
      },
      {
        id: 12,
        nome: "36",
        ativada: true,
        estoque: {},
      },
    ],
  });

  assert.equal(isCatalogProductAvailable(product), true);
});

test("interpreta corretamente o campo ativada da variacao", () => {
  const product = createProduct({
    variacoes: [
      {
        id: 11,
        nome: "35",
        ativada: false,
        estoque: {
          estoque: 5,
        },
      },
    ],
  });

  assert.equal(isCatalogProductAvailable(product), false);
});
