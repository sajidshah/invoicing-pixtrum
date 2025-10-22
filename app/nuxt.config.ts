// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: ["@nuxtjs/tailwindcss"],

  css: ["~/styles/main.css"],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
      pdfServiceUrl:
        process.env.NUXT_PUBLIC_PDF_SERVICE_URL || "http://localhost:8080",
    },
  },

  app: {
    head: {
      title: "Invoicing Pixtrum",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "Modern invoice management system" },
      ],
    },
  },

  // Keep type-checking in dev, skip in production builds (prevents vue-tsc patch crash on Railway)
  typescript: {
    strict: true,
    typeCheck: process.env.NODE_ENV !== "production",
  },

  compatibilityDate: "2024-01-01",
});
