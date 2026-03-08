import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const token = process.env.FACILZAP_TOKEN?.trim();
const baseUrl =
  process.env.FACILZAP_API_BASE_URL?.trim().replace(/\/+$/, "") ||
  "https://api.facilzap.app.br";

if (!token) {
  console.error(
    "FACILZAP_TOKEN nao configurado. Defina a variavel em .env.local antes de rodar o probe.",
  );
  process.exit(1);
}

const outputDir = path.join(process.cwd(), "tmp", "facilzap-samples");

function hasImage(product) {
  if (!product || typeof product !== "object") {
    return false;
  }

  if (typeof product.imagem === "string" && product.imagem.trim()) {
    return true;
  }

  if (Array.isArray(product.imagens) && product.imagens.length > 0) {
    return true;
  }

  if (typeof product.imagens === "string" && product.imagens.trim()) {
    return true;
  }

  return false;
}

function hasVariations(product) {
  if (!product || typeof product !== "object") {
    return false;
  }

  if (Array.isArray(product.variacoes)) {
    return product.variacoes.length > 0;
  }

  return typeof product.variacoes === "string" && product.variacoes.trim() !== "";
}

async function request(endpoint, query) {
  const url = new URL(endpoint, `${baseUrl}/`);

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha em ${endpoint}: ${response.status} ${body}`);
  }

  return response.json();
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const [categories, products, variations] = await Promise.all([
    request("/categorias", { page: 1, length: 5 }),
    request("/produtos", { page: 1, length: 25 }),
    request("/variacoes", { page: 1, length: 25 }),
  ]);

  const categorySample = categories.data?.[0] ?? null;
  const productWithImage =
    products.data?.find((item) => hasImage(item)) ?? products.data?.[0] ?? null;
  const productWithVariations =
    products.data?.find((item) => hasVariations(item)) ?? null;
  const variationSample = variations.data?.[0] ?? null;

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    endpoints: ["/categorias", "/produtos", "/variacoes"],
    counts: {
      categorias: categories.data?.length ?? 0,
      produtos: products.data?.length ?? 0,
      variacoes: variations.data?.length ?? 0,
    },
    samples: {
      categorySample,
      productWithImage,
      productWithVariations,
      variationSample,
    },
  };

  await Promise.all([
    writeFile(
      path.join(outputDir, "categorias-page-1.json"),
      JSON.stringify(categories, null, 2),
      "utf8",
    ),
    writeFile(
      path.join(outputDir, "produtos-page-1.json"),
      JSON.stringify(products, null, 2),
      "utf8",
    ),
    writeFile(
      path.join(outputDir, "variacoes-page-1.json"),
      JSON.stringify(variations, null, 2),
      "utf8",
    ),
    writeFile(
      path.join(outputDir, "summary.json"),
      JSON.stringify(summary, null, 2),
      "utf8",
    ),
  ]);

  console.log("Probe concluido.");
  console.log(`Arquivos salvos em: ${outputDir}`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
