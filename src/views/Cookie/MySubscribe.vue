

<script setup lang="ts">
import { useCookieRegStore } from '@/stores/cookieReg';
import tabInfo from '@/utils/tabs/useTab'
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const cookieRegStore = useCookieRegStore()
const { register } = storeToRefs(cookieRegStore)
const { currentDomain } = tabInfo


const currentSubs = computed(() => {
    const subs: { targetDomain: string }[] = []
    for (const key in register.value) {
        const item = register.value[key]
        for (const sub of item.subscribers) {
            if (sub.domain === currentDomain.value) {
                subs.push({ targetDomain: key })
                break
            }
        }
    }
    return subs
})
</script>

<template>
    <el-table :data="currentSubs" stripe style="width: 100%">
        <el-table-column prop="targetDomain" label="订阅域名" />

        <el-table-column fixed="right" label="操作" width="120">
            <template #default="{ row }">
                <el-button link type="primary" size="small"
                    @click="cookieRegStore.unReg(currentDomain!, row.targetDomain)">删除
                </el-button>
            </template>
        </el-table-column>
    </el-table>
</template>