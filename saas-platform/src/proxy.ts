import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, isAuthenticated } = await auth();
  const url = req.nextUrl;

  console.log("🔥 Middleware running on:", url.pathname);
  console.log("🔐 Is authenticated:", isAuthenticated);
  console.log("👤 User ID:", userId);
  console.log("🔓 Is public route:", isPublicRoute(req));

  // If user is signed in and trying to access sign-in/sign-up, redirect to dashboard
  if (userId && (url.pathname === "/sign-in" || url.pathname === "/sign-up")) {
    console.log("✅ Redirecting authenticated user to dashboard");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // If route is not public and user is not signed in, protect it
  if (!isPublicRoute(req) && !userId) {
    console.log("🔒 Protecting route, redirecting to sign-in");
    await auth.protect();
  }

  console.log("✅ Allowing request to proceed");
  return NextResponse.next();
},
  { debug: true },
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    //'/(api|trpc)(.*)',
  ],
};