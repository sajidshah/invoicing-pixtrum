<template>
  <ClientOnly>
    <div
      v-if="!authReady"
      class="min-h-screen flex items-center justify-center bg-gray-50"
    >
      <div class="text-center">
        <div
          class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"
        ></div>
        <p class="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
    <NuxtLayout v-else>
      <NuxtPage />
    </NuxtLayout>
    <template #fallback>
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="text-center">
          <div
            class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"
          ></div>
          <p class="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
const { initAuth, loading: authLoading, user } = useAuth();
const authReady = ref(false);
const router = useRouter();
const route = useRoute();

// Initialize auth state listener on client side
onMounted(async () => {
  initAuth();
  // Wait for auth to finish loading
  watch(
    authLoading,
    (isLoading) => {
      if (!isLoading) {
        console.log("Auth is ready, showing app");
        console.log(
          "Current route:",
          route.path,
          "User:",
          user.value?.email || "null"
        );

        authReady.value = true;

        // After auth is ready, check if we need to redirect
        nextTick(() => {
          const publicRoutes = ["/login", "/register"];

          // If no user and on protected route, go to login
          if (!user.value && !publicRoutes.includes(route.path)) {
            console.log("No user on protected route, redirecting to /login");
            router.push("/login");
          }
          // If user exists and on auth page, go to dashboard
          else if (user.value && publicRoutes.includes(route.path)) {
            console.log("User on auth page, redirecting to /");
            router.push("/");
          } else {
            console.log("No redirect needed, staying on", route.path);
          }
        });
      }
    },
    { immediate: true }
  );
});
</script>
