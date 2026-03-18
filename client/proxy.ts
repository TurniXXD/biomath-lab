export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: ["/matrix/:path*", "/blast/:path*"],
};
