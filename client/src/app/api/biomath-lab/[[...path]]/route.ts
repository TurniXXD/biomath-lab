import { type NextRequest, NextResponse } from "next/server";

const piApiOrigin = process.env.PI_API_ORIGIN;
const basePath = "/api/biomath-lab";
const logPrefix = "[api/biomath-lab proxy]";

const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const buildTargetUrl = (request: NextRequest) => {
  if (!piApiOrigin) {
    return null;
  }

  const target = new URL(piApiOrigin);
  const incomingPath = request.nextUrl.pathname.slice(basePath.length);
  target.pathname = `${basePath}${incomingPath}`;
  target.search = request.nextUrl.search;
  return target;
};

const proxyRequest = async (request: NextRequest) => {
  const targetUrl = buildTargetUrl(request);
  if (!targetUrl) {
    console.error(`${logPrefix} PI_API_ORIGIN is not set`);
    return NextResponse.json(
      { error: "PI_API_ORIGIN is not set" },
      { status: 500 },
    );
  }

  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("content-length");

  for (const header of hopByHopHeaders) {
    headers.delete(header);
  }

  const hasBody = !["GET", "HEAD"].includes(request.method);
  console.info(
    `${logPrefix} ${request.method} ${request.nextUrl.pathname}${request.nextUrl.search} -> ${targetUrl.toString()}`,
  );

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
    cache: "no-store",
  });

  console.info(
    `${logPrefix} upstream ${response.status} ${response.statusText} for ${targetUrl.toString()}`,
  );

  const responseHeaders = new Headers(response.headers);
  for (const header of hopByHopHeaders) {
    responseHeaders.delete(header);
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  return proxyRequest(request);
}
