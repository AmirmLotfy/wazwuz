#!/usr/bin/env node
/**
 * Smoke test: hits main routes and asserts status or key content.
 * Run with: node scripts/smoke-test.mjs
 * Or: NEXT_PUBLIC_APP_URL=http://localhost:3000 node scripts/smoke-test.mjs
 */
const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function fetchOk(url, options = {}) {
  const res = await fetch(url, { ...options, redirect: "manual" });
  return { ok: res.ok, status: res.status, url };
}

async function main() {
  const checks = [
    { name: "Home", fn: () => fetchOk(BASE) },
    { name: "Signin", fn: () => fetchOk(`${BASE}/signin`) },
    { name: "App (redirect to signin)", fn: () => fetchOk(`${BASE}/app`) },
  ];

  console.log("Smoke test:", BASE);
  let failed = 0;
  for (const { name, fn } of checks) {
    try {
      const result = await fn();
      const pass = result.ok || result.status === 307 || result.status === 302;
      console.log(pass ? "✓" : "✗", name, result.status);
      if (!pass) failed++;
    } catch (e) {
      console.log("✗", name, e.message);
      failed++;
    }
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
