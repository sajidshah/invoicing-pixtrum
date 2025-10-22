<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-bold text-gray-900">
          Create your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Or
          <NuxtLink
            to="/login"
            class="font-medium text-primary-600 hover:text-primary-500"
          >
            sign in to existing account
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
          <label for="displayName" class="label">Display Name (optional)</label>
          <input
            id="displayName"
            v-model="formData.displayName"
            type="text"
            class="input"
            placeholder="John Doe"
          />
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
          <p class="text-xs text-gray-500 mt-1">
            Must be at least 6 characters
          </p>
        </div>

        <button type="submit" :disabled="isLoading" class="btn-primary w-full">
          {{ isLoading ? "Creating account..." : "Create account" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { registerSchema } from "~/lib/validators";

const { register } = useAuth();
const router = useRouter();

const formData = reactive({
  email: "",
  password: "",
  displayName: "",
});

const error = ref<string | null>(null);
const isLoading = ref(false);

const handleSubmit = async () => {
  error.value = null;

  // Validate form
  const validation = registerSchema.safeParse(formData);
  if (!validation.success) {
    error.value = validation.error.errors[0].message;
    return;
  }

  isLoading.value = true;

  const { error: registerError } = await register(
    formData.email,
    formData.password,
    formData.displayName || undefined
  );

  isLoading.value = false;

  if (registerError) {
    error.value = registerError;
  } else {
    router.push("/");
  }
};
</script>
