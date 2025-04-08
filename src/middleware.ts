import { authMiddleware, clerkClient } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: [
    "/",
    "/api/webhook/stripe",
    "/pricing",
    "/api/trpc/payment.createCheckoutSession",
  ],
  async afterAuth(auth, req) {
    // Handle authenticated users
    if (auth.userId && auth.isPublicRoute) {
      // If user is logged in and the route is public, redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If user is not logged in and the route is private, Clerk will redirect to sign-in
    
    // If user is logged in and accessing a private route, continue
    if (auth.userId) {
      // You can add custom logic here for authenticated users
      // For example, checking subscription status and redirecting if needed
    }
  },
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
