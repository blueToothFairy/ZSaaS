import { Request } from "express";

const COUNTRY_HEADER_CANDIDATES = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "cloudfront-viewer-country",
  "x-country-code",
  "x-country",
];

function normalizeCountryCode(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const cleaned = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(cleaned) ? cleaned : undefined;
}

function getHeaderValue(req: Request, headerName: string): string | undefined {
  const headerValue = req.headers[headerName];

  if (Array.isArray(headerValue)) {
    return headerValue[0];
  }

  return typeof headerValue === "string" ? headerValue : undefined;
}

export function resolveCountryCodeFromRequest(req: Request): string | undefined {
  for (const headerName of COUNTRY_HEADER_CANDIDATES) {
    const normalized = normalizeCountryCode(getHeaderValue(req, headerName));
    if (normalized) {
      return normalized;
    }
  }

  const acceptLanguage = getHeaderValue(req, "accept-language");
  if (!acceptLanguage) {
    return undefined;
  }

  const locales = acceptLanguage.split(",").map((entry) => entry.trim());
  for (const locale of locales) {
    const match = locale.match(/^[a-z]{2}(?:-([A-Z]{2}))?/i);
    const region = match?.[1];
    const normalized = normalizeCountryCode(region);

    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}
