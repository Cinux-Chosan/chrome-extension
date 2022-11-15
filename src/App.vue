<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>

  <Suspense>
    <RouterView />
  </Suspense>
</template>

<style scoped>

</style>

<style>
html,
body {
  width: 800px;
}
</style>
