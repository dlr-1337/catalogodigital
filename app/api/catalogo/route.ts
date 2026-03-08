import type { NextRequest } from "next/server";
import { FacilzapConfigError } from "@/lib/env";
import { getCatalogProducts } from "@/services/facilzap/catalog";

export const runtime = "nodejs";
export const revalidate = 60;

const responseHeaders = {
  "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
};

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("categoria") ?? "all";

  try {
    const products = await getCatalogProducts(category);
    return Response.json(products, { headers: responseHeaders });
  } catch (error) {
    const status = error instanceof FacilzapConfigError ? 503 : 502;
    const message =
      error instanceof FacilzapConfigError
        ? error.message
        : "Nao foi possivel carregar o catalogo.";

    if (!(error instanceof FacilzapConfigError)) {
      console.error("[api/catalogo] request failed", error);
    }

    return Response.json({ message }, { status, headers: responseHeaders });
  }
}
