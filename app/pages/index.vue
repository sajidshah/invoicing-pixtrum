<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-bold text-gray-900">
          Welcome to Invoicing Pixtrum
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Manage your clients and invoices with ease
        </p>
      </div>

      <div class="card space-y-4">
        <div v-if="user">
          <p class="text-lg mb-4">Hello, {{ user.email }}!</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NuxtLink
              to="/clients"
              class="block p-6 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <h3 class="text-xl font-semibold text-primary-900 mb-2">
                Clients
              </h3>
              <p class="text-primary-700">Manage your client database</p>
            </NuxtLink>

            <NuxtLink
              to="/invoices"
              class="block p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <h3 class="text-xl font-semibold text-green-900 mb-2">
                Invoices
              </h3>
              <p class="text-green-700">Create and manage invoices</p>
            </NuxtLink>

            <NuxtLink
              to="/settings"
              class="block p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <h3 class="text-xl font-semibold text-blue-900 mb-2">Settings</h3>
              <p class="text-blue-700">Configure invoice defaults</p>
            </NuxtLink>
          </div>

          <button @click="handleLogout" class="btn-secondary w-full mt-6">
            Sign Out
          </button>
        </div>

        <div v-else class="text-center">
          <p class="mb-4">Please sign in to continue</p>
          <NuxtLink to="/login" class="btn-primary"> Sign In </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, logout } = useAuth();
const router = useRouter();

const handleLogout = async () => {
  const { error } = await logout();
  if (!error) {
    router.push("/login");
  }
};
</script>
