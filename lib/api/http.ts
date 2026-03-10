import { NextResponse } from "next/server";

export function errorJson(
  error: string,
  status: number,
  code: string,
  details?: unknown
) {
  return NextResponse.json(
    { error, code, ...(details !== undefined ? { details } : {}) },
    { status }
  );
}

export function withDeprecatedAliasHeaders(
  response: Response,
  canonicalRoute: string
) {
  response.headers.set("x-wazwuz-route-alias", "deprecated");
  response.headers.set("x-wazwuz-canonical-route", canonicalRoute);
  response.headers.set(
    "warning",
    `299 WazWuz API alias deprecated; use ${canonicalRoute}`
  );
  return response;
}
