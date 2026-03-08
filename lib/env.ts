export const FACILZAP_REVALIDATE_SECONDS = 60;
export const DEFAULT_FACILZAP_API_BASE_URL = "https://api.facilzap.app.br";

export class FacilzapConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FacilzapConfigError";
  }
}

export function getFacilzapEnv() {
  return {
    token: process.env.FACILZAP_TOKEN?.trim() ?? "",
    baseUrl:
      process.env.FACILZAP_API_BASE_URL?.trim().replace(/\/+$/, "") ??
      DEFAULT_FACILZAP_API_BASE_URL,
  };
}

export function assertFacilzapEnv() {
  const env = getFacilzapEnv();

  if (!env.token) {
    throw new FacilzapConfigError(
      "FACILZAP_TOKEN nao configurado. Defina a variavel em .env.local ou na Vercel.",
    );
  }

  if (!env.baseUrl) {
    throw new FacilzapConfigError(
      "FACILZAP_API_BASE_URL nao configurado.",
    );
  }

  return env;
}
