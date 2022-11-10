<script setup lang="ts">
const modules = [
  {
    name: 'gitlab'
  },
  {
    name: 'jira',
  },
  {
    name: 'cookie',
    to: { name: 'cookie' }
  }
]
</script>

<template>
  <main>
    <ul class="work-modules">
      <template v-for="item in modules" :key="item.name">
        <router-link :to="item.to" v-if="item.to" custom v-slot="{ navigate }">
          <li @click="navigate" role="link">
            {{ item.name }}
          </li>
        </router-link>
        <li v-else>{{ item.name }}</li>
      </template>
    </ul>
  </main>
</template>


<style lang="less" scoped>
.work-modules {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(auto-fill, 100px);
  gap: 10px;

  >li {
    border-radius: 5px;
    background-color: aqua;
    height: 100px;
    display: grid;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    &:hover {
      filter: brightness(1.2);
    }
  }
}
</style>