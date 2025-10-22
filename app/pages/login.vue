<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <NuxtLink
            to="/register"
            class="font-medium text-primary-600 hover:text-primary-500"
          >
            create a new account
          </NuxtLink>
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="card space-y-6">
        <div
          v-if="error"
          class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
        >
          {{ error }}
        </div>

        <div>
          <label for="email" class="label">Email address</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            class="input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label for="password" class="label">Password</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            required
            class="input"
            placeholder="••••••••"
          />
        </div>

        <button type="submit" :disabled="isLoading" class="btn-primary w-full">
          {{ isLoading ? "Signing in..." : "Sign in" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { loginSchema } from "~/lib/validators";

const { login } = useAuth();
const router = useRouter();

const formData = reactive({
  email: "",
  password: "",
});

const error = ref<string | null>(null);
const isLoading = ref(false);

const handleSubmit = async () => {
  error.value = null;

  // Validate form
  const validation = loginSchema.safeParse(formData);
  if (!validation.success) {
    error.value = validation.error.errors[0].message;
    return;
  }

  isLoading.value = true;

  const { error: loginError } = await login(formData.email, formData.password);

  isLoading.value = false;

  if (loginError) {
    error.value = loginError;
  } else {
    router.push("/");
  }
};
</script>
