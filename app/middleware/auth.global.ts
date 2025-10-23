export default defineNuxtRouteMiddleware(async (to) => {
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

  // Public routes and onboarding route
  const publicRoutes = ["/login", "/register"];
  const onboardingRoute = "/onboarding";

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

  // Check onboarding status for authenticated users
  if (
    user.value &&
    to.path !== onboardingRoute &&
    !publicRoutes.includes(to.path)
  ) {
    const { checkOnboardingStatus } = useOnboarding();
    const { isComplete } = await checkOnboardingStatus();

    if (!isComplete) {
      console.log(
        "[Middleware] Onboarding incomplete, redirecting to /onboarding"
      );
      return navigateTo(onboardingRoute);
    }
  }

  // If user is on onboarding route but has already completed it, redirect to home
  if (user.value && to.path === onboardingRoute) {
    const { checkOnboardingStatus } = useOnboarding();
    const { isComplete } = await checkOnboardingStatus();

    if (isComplete) {
      console.log("[Middleware] Onboarding already complete, redirecting to /");
      return navigateTo("/");
    }
  }

  console.log("[Middleware] Allowing navigation to", to.path);
});
