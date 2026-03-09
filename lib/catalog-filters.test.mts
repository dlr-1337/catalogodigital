import assert from "node:assert/strict";
import test from "node:test";

import {
  collectAvailableSizes,
  filterCatalogProducts,
  normalizeSearchText,
} from "./catalog-filters.ts";

const products = [
  {
    id: "1",
    categoria: "rasteiras",
    nome: "Sandália Rosé Elegante",
    tamanhosDisponiveis: ["34", "35/36", "Unico"],
  },
  {
    id: "2",
    categoria: "rasteiras",
    nome: "Tamanco Preto",
    tamanhosDisponiveis: ["38", "39"],
  },
  {
    id: "3",
    categoria: "botas",
    nome: "Bota Cano Curto",
    tamanhosDisponiveis: ["35/36", "40"],
  },
];

test("normalizeSearchText normaliza acentos, caixa e espacos extras", () => {
  assert.equal(normalizeSearchText("  Sandália   Rosé  "), "sandalia rose");
});

test("collectAvailableSizes deduplica e ordena os tamanhos da categoria", () => {
  assert.deepEqual(collectAvailableSizes(products), [
    "34",
    "35/36",
    "38",
    "39",
    "40",
    "Unico",
  ]);
});

test("filterCatalogProducts aplica busca por nome sem diferenciar acentos", () => {
  const filtered = filterCatalogProducts(products, {
    categoria: "rasteiras",
    nome: "rose",
  });

  assert.deepEqual(
    filtered.map((product) => product.id),
    ["1"],
  );
});

test("filterCatalogProducts aplica tamanho exato sem casar parcialmente", () => {
  const filtered = filterCatalogProducts(products, {
    tamanho: "35/36",
  });

  assert.deepEqual(
    filtered.map((product) => product.id),
    ["1", "3"],
  );

  const exactOnly = filterCatalogProducts(products, {
    tamanho: "35",
  });

  assert.deepEqual(exactOnly, []);
});
