import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set(["res.cloudinary.com"]);

function json(status: number, body: any) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function GET(req: NextRequest) {
  try {
    const urlParam = req.nextUrl.searchParams.get("url");
    const filename = req.nextUrl.searchParams.get("filename") || "documento.pdf";
    if (!urlParam) return json(400, { error: "Missing url" });

    let remote: URL;
    try {
      remote = new URL(urlParam);
    } catch {
      return json(400, { error: "Bad url" });
    }

    if (!ALLOWED_HOSTS.has(remote.hostname)) {
      return json(403, { error: "Host not allowed", host: remote.hostname });
    }

    const upstream = await fetch(remote.toString(), { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text().catch(() => "");
      return json(upstream.status, { error: `Upstream ${upstream.status}`, info: t || "No body", requested: remote.toString() });
    }

    // Fijamos headers para que el navegador lo muestre inline como PDF
    const headers = new Headers();
    // Si es PDF, Cloudinary ya sirve application/pdf; igual lo reforzamos:
    headers.set("content-type", "application/pdf");
    headers.set("content-disposition", `inline; filename="${filename}"`);
    headers.set("cache-control", "private, max-age=0, no-store");
    headers.set("cross-origin-resource-policy", "cross-origin");

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (err: any) {
    return json(500, { error: "Proxy failure", detail: err?.message });
  }
}
