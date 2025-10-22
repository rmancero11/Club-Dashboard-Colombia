export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getAuth } from "@/app/lib/auth";

const ALLOWED_HOSTS = new Set(["res.cloudinary.com"]);

function json(status:number, body:any) {
  return new NextResponse(JSON.stringify(body), { status, headers:{ "content-type":"application/json; charset=utf-8" }});
}
const isPdfUrl = (u:URL) => /\.pdf(\?|#|$)/i.test(u.pathname) || (u.searchParams.get("ext")||"").toLowerCase()==="pdf";

function parseCL(u:URL){
  const m = u.pathname.match(/^\/([^/]+)\/(image|video)\/upload\/(?:v(\d+)\/)?(.+?)\.([a-z0-9]+)$/i);
  if (!m) return null;
  const [, , resource_type, version, public_id, format] = m;
  return { resource_type, version: version? Number(version):undefined, public_id, format } as const;
}
function clientIdFromPublicId(pid:string){ const p=pid.split("/"); return p[0]==="clubviajeros" && p[1]==="clients" ? p[2]||null : (p[0]==="clients" ? p[1]||null : null); }

export async function GET(req: NextRequest) {
  const auth = await getAuth();
  if (!auth) return json(401, { error:"No autenticado" });

  const urlParam = req.nextUrl.searchParams.get("url");
  const hintedClientId = req.nextUrl.searchParams.get("clientId") || undefined;
  const filename = req.nextUrl.searchParams.get("filename") || "documento.pdf";
  if (!urlParam) return json(400, { error:"Missing url" });

  let remote: URL;
  try { remote = new URL(urlParam); } catch { return json(400, { error:"Bad url" }); }
  if (!ALLOWED_HOSTS.has(remote.hostname)) return json(403, { error:"Host not allowed" });

  // ACL basada en clientId (derivado del public_id o query)
  const parsed = parseCL(remote);
  if (parsed) {
    const derived = clientIdFromPublicId(parsed.public_id || "");
    const effectiveClientId = hintedClientId || derived || undefined;
    if (effectiveClientId) {
      const c = await prisma.client.findUnique({ where:{ id: effectiveClientId }, select:{ sellerId:true, userId:true }});
      if (!c) return json(404, { error:"Cliente no existe" });
      const isAdmin = auth.role === "ADMIN";
      const isSeller = auth.role === "SELLER" && c.sellerId === auth.userId;
      const isUser   = auth.role === "USER"   && c.userId   === auth.userId;
      if (!isAdmin && !isSeller && !isUser) return json(403, { error:"Sin permisos para este cliente" });
    }
  }

  const upstream = await fetch(remote.toString(), { cache:"no-store" });
  if (!upstream.ok || !upstream.body) {
    const t = await upstream.text().catch(()=> "");
    return json(upstream.status, { error:`Upstream ${upstream.status}`, info:t || "No body", requested: remote.toString() });
  }

  const headers = new Headers();
  headers.set("content-type", upstream.headers.get("content-type") || (isPdfUrl(remote)? "application/pdf" : "application/octet-stream"));
  headers.set("content-disposition", `inline; filename="${filename}"`);
  headers.set("cache-control", "private, max-age=0, no-store");
  headers.set("cross-origin-resource-policy", "cross-origin");
  return new NextResponse(upstream.body, { status:200, headers });
}
