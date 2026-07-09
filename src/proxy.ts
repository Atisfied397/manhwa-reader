import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

export const proxy = clerkMiddleware();

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};