<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="handleClose"
    >
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

      <div class="flex min-h-screen items-center justify-center p-4">
        <div
          class="relative w-full max-w-xl bg-white rounded-lg shadow-xl"
          @click.stop
        >
          <div class="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Clone Invoice</h3>
              <p class="text-sm text-gray-500 mt-1">
                Invoice #{{ invoice.number }}
              </p>
            </div>
            <button
              @click="handleClose"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form class="p-6 space-y-4" @submit.prevent="handleClone">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="cloneRangeStart" class="label">Range Start</label>
                <input
                  id="cloneRangeStart"
                  v-model="dateRange.start"
                  type="date"
                  required
                  class="input"
                />
              </div>
              <div>
                <label for="cloneRangeEnd" class="label">Range End</label>
                <input
                  id="cloneRangeEnd"
                  v-model="dateRange.end"
                  type="date"
                  required
                  class="input"
                />
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p class="text-xs font-medium text-gray-500">Description</p>
              <p class="text-sm text-gray-900 mt-1">{{ descriptionPreview }}</p>
              <p class="text-xs text-gray-500 mt-3">Subject</p>
              <p class="text-sm text-gray-900 mt-1">{{ subjectPreview }}</p>
            </div>

            <div class="flex justify-end space-x-3 pt-2">
              <button type="button" @click="handleClose" class="btn-secondary">
                Cancel
              </button>
              <button type="submit" class="btn-primary">
                Create Clone
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Invoice } from "~/lib/types";

interface Props {
  isOpen: boolean;
  invoice: Invoice;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  clone: [payload: { dateStart: string; dateEnd: string; description: string }];
}>();

const dateRange = reactive({
  start: "",
  end: "",
});

const setDefaults = () => {
  dateRange.start = props.invoice.issueDate || "";
  dateRange.end = props.invoice.issueDate || "";
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      setDefaults();
    }
  },
  { immediate: true }
);

const getIsoWeekNumber = (date: Date): number => {
  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const getWeekRange = (): { weekStart: number; weekEnd: number; year: number } => {
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const weekStart = getIsoWeekNumber(startDate);
  const weekEnd = getIsoWeekNumber(endDate);
  return { weekStart, weekEnd, year: endDate.getFullYear() };
};

const descriptionPreview = computed(() => {
  if (!dateRange.start || !dateRange.end) return "";
  const { weekStart, weekEnd } = getWeekRange();
  return `Week ${weekStart} & ${weekEnd} Salary`;
});

const subjectPreview = computed(() => {
  if (!dateRange.start || !dateRange.end) return "";
  const { weekStart, weekEnd, year } = getWeekRange();
  return `Salary Invoice for Weeks ${weekStart} & ${weekEnd}, ${year}`;
});

const handleClone = () => {
  if (!dateRange.start || !dateRange.end) return;

  emit("clone", {
    dateStart: dateRange.start,
    dateEnd: dateRange.end,
    description: descriptionPreview.value,
  });
};

const handleClose = () => {
  emit("close");
};
</script>
