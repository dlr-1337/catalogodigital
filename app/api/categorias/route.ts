import { FacilzapConfigError } from "@/lib/env";
import { getCatalogCategories } from "@/services/facilzap/catalog";

export const runtime = "nodejs";
export const revalidate = 60;

const responseHeaders = {
  "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
};

export async function GET() {
  try {
    const categories = await getCatalogCategories();
    return Response.json(categories, { headers: responseHeaders });
  } catch (error) {
    const status = error instanceof FacilzapConfigError ? 503 : 502;
    const message =
      error instanceof FacilzapConfigError
        ? error.message
        : "Nao foi possivel carregar as categorias.";

    if (!(error instanceof FacilzapConfigError)) {
      console.error("[api/categorias] request failed", error);
    }

    return Response.json({ message }, { status, headers: responseHeaders });
  }
}
