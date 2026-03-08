import {
  assertFacilzapEnv,
  FACILZAP_REVALIDATE_SECONDS,
} from "@/lib/env";
import type { FacilzapApiListResponse } from "@/types/facilzap";

type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | QueryValue[]
  | { [key: string]: QueryValue };

type FetchFacilzapOptions = {
  query?: Record<string, QueryValue>;
  revalidate?: number;
  tags?: string[];
  timeoutMs?: number;
  retryCount?: number;
};

type ListAllPagesOptions = {
  query?: Record<string, QueryValue>;
  revalidate?: number;
  tags?: string[];
  pageSize?: number;
  maxPages?: number;
};

const TRANSIENT_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

export class FacilzapRequestError extends Error {
  constructor(
    message: string,
    readonly url: string,
    readonly status?: number,
    readonly details?: string,
  ) {
    super(message);
    this.name = "FacilzapRequestError";
  }
}

function isRecord(value: unknown): value is Record<string, QueryValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function appendQueryParam(
  entries: Array<[string, string]>,
  key: string,
  value: QueryValue,
) {
  if (value === null || value === undefined || value === "") {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendQueryParam(entries, `${key}[]`, item);
    }
    return;
  }

  if (isRecord(value)) {
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      appendQueryParam(entries, `${key}[${nestedKey}]`, nestedValue);
    }
    return;
  }

  entries.push([key, String(value)]);
}

function buildQueryString(query?: Record<string, QueryValue>) {
  if (!query) {
    return "";
  }

  const entries: Array<[string, string]> = [];

  for (const [key, value] of Object.entries(query)) {
    appendQueryParam(entries, key, value);
  }

  const params = new URLSearchParams();

  for (const [key, value] of entries) {
    params.append(key, value);
  }

  return params.toString();
}

function getPayloadArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as FacilzapApiListResponse<T>).data)
  ) {
    return (payload as FacilzapApiListResponse<T>).data ?? [];
  }

  return [];
}

function shouldRetry(status?: number) {
  return status !== undefined && TRANSIENT_STATUS.has(status);
}

function getBatchFingerprint(items: unknown[]) {
  const preview = items.slice(0, 3).map((item) => {
    if (item && typeof item === "object" && "id" in item) {
      return String((item as { id?: unknown }).id ?? "");
    }
    return JSON.stringify(item);
  });

  return `${items.length}:${preview.join("|")}`;
}

export async function fetchFacilzap<T>(
  path: string,
  options: FetchFacilzapOptions = {},
): Promise<T> {
  const env = assertFacilzapEnv();
  const retryCount = options.retryCount ?? 1;
  const timeoutMs = options.timeoutMs ?? 8000;

  const url = new URL(path, `${env.baseUrl}/`);
  const queryString = buildQueryString(options.query);

  if (queryString) {
    url.search = queryString;
  }

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${env.token}`,
        },
        next: {
          revalidate: options.revalidate ?? FACILZAP_REVALIDATE_SECONDS,
          tags: options.tags,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const duration = Date.now() - startedAt;
      console.info(
        `[facilzap] ${response.status} ${url.pathname}${url.search} (${duration}ms)`,
      );

      if (!response.ok) {
        const details = (await response.text()).slice(0, 400);

        if (attempt < retryCount && shouldRetry(response.status)) {
          console.warn(
            `[facilzap] retry ${attempt + 1}/${retryCount} for ${url.pathname}`,
          );
          continue;
        }

        throw new FacilzapRequestError(
          `Falha ao consultar ${url.pathname}`,
          url.toString(),
          response.status,
          details,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeout);
      const isAbortError =
        error instanceof Error && error.name === "AbortError";
      const duration = Date.now() - startedAt;

      if (attempt < retryCount) {
        console.warn(
          `[facilzap] retry ${attempt + 1}/${retryCount} after ${
            isAbortError ? "timeout" : "network"
          } on ${url.pathname} (${duration}ms)`,
        );
        continue;
      }

      if (error instanceof FacilzapRequestError) {
        throw error;
      }

      throw new FacilzapRequestError(
        isAbortError
          ? `Timeout ao consultar ${url.pathname}`
          : `Erro de rede ao consultar ${url.pathname}`,
        url.toString(),
      );
    }
  }

  throw new FacilzapRequestError(
    `Falha inesperada ao consultar ${url.pathname}`,
    url.toString(),
  );
}

export async function listAllPages<T>(
  path: string,
  options: ListAllPagesOptions = {},
) {
  const pageSize = options.pageSize ?? 100;
  const maxPages = options.maxPages ?? 50;
  const items: T[] = [];
  const seenFingerprints = new Set<string>();

  for (let page = 1; page <= maxPages; page += 1) {
    const payload = await fetchFacilzap<FacilzapApiListResponse<T>>(path, {
      query: {
        ...(options.query ?? {}),
        page,
        length: pageSize,
      },
      revalidate: options.revalidate,
      tags: options.tags,
    });

    const batch = getPayloadArray<T>(payload);
    const fingerprint = getBatchFingerprint(batch);

    console.info(
      `[facilzap] page ${page} from ${path} returned ${batch.length} records`,
    );

    if (batch.length === 0) {
      break;
    }

    if (seenFingerprints.has(fingerprint)) {
      console.warn(
        `[facilzap] repeated batch detected on ${path} page ${page}; stopping pagination`,
      );
      break;
    }

    seenFingerprints.add(fingerprint);
    items.push(...batch);

    if (batch.length < pageSize) {
      break;
    }
  }

  if (items.length > 0 && seenFingerprints.size >= maxPages) {
    console.warn(
      `[facilzap] maxPages (${maxPages}) reached while listing ${path}`,
    );
  }

  return items;
}
