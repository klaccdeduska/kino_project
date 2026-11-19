<script setup lang="ts">
defineProps<{
  time: string
  urgent: boolean
}>()
</script>

<template>
  <div class="countdown" :class="{ urgent }" role="timer">
    <span>Time left to confirm</span>
    <strong>{{ time }}</strong>
  </div>
</template>

<style scoped>
.countdown {
  position: fixed;
  right: max(12px, env(safe-area-inset-right));
  bottom: max(12px, env(safe-area-inset-bottom));
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border: 1px solid #c4b5fd;
  border-radius: 8px;
  background: #c4b5fd;
  color: #20152f;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 4px 16px #0006;
}

.countdown strong {
  font-size: 20px;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.countdown.urgent {
  border-color: #a16a66;
}

.countdown.urgent strong {
  color: #7f1d1d;
}
</style>
