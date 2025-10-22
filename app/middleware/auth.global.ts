export default defineNuxtRouteMiddleware((to) => {
  // Only run on client side to avoid SSR hydration issues
  if (process.server) {
    return;
  }

  const { user, loading } = useAuth();

  console.log(
    "[Middleware] to:",
    to.path,
    "user:",
    user.value?.email || "null",
    "loading:",
    loading.value
  );

  // Don't redirect while auth is loading (app.vue shows loading screen)
  if (loading.value) {
    console.log("[Middleware] Still loading, skipping");
    return;
  }

  // Public routes
  const publicRoutes = ["/login", "/register"];

  // If user is not authenticated and trying to access protected route
  if (!user.value && !publicRoutes.includes(to.path)) {
    console.log("[Middleware] No user, redirecting to /login");
    return navigateTo("/login");
  }

  // If user is authenticated and trying to access auth pages
  if (user.value && publicRoutes.includes(to.path)) {
    console.log(
      "[Middleware] User authenticated on auth page, redirecting to /"
    );
    return navigateTo("/");
  }

  console.log("[Middleware] Allowing navigation to", to.path);
});
