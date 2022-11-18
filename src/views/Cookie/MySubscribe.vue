

<script setup lang="ts">
import { useCookieRegStore } from '@/stores/cookieReg';
import type { RegStore } from '@/stores/cookieReg/type';
import tabInfo from '@/utils/tabs/useTab'
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { sortAndLift } from './utils';

const cookieRegStore = useCookieRegStore()
const { unReg } = cookieRegStore
const { register } = storeToRefs(cookieRegStore)
const { currentDomain, isHttpTab } = tabInfo

// 根据 store 生成以订阅者分组的订阅信息
const subBySubscriber = computed(() => {
    const store = {} as RegStore
    for (const key in register.value) {
        const item = register.value[key]
        for (const sub of item.subscribers) {
            let subData = store[sub.domain]
            if (!subData) {
                subData = store[sub.domain] = {
                    subscribers: []
                }
            }
            subData.subscribers.push({ domain: key })
        }
    }
    return store
})


// 当前订阅
const currentSubs = computed(() => (currentDomain.value && subBySubscriber.value[currentDomain.value]?.subscribers) || [])

// 所有订阅相关
const { subViewType, allSubSourceByViewType, allSubSourceByViewTypeSortedKeys, unRegWrapper } = (() => {
    const subViewType = ref(false)
    const allSubSourceByViewType = computed(() => subViewType.value ? register.value : subBySubscriber.value)
    const allSubSourceByViewTypeSortedKeys = computed(() => Object.keys(allSubSourceByViewType.value).sort((a, b) => sortAndLift(a, b, currentDomain.value)))
    const unRegWrapper = (d1: string, d2: string) => subViewType.value ? unReg(d1, d2) : unReg(d2, d1)
    return {
        subViewType,
        allSubSourceByViewType,
        allSubSourceByViewTypeSortedKeys,
        unRegWrapper
    }
})()


</script>

<template>
    <el-card header="当前域名订阅" v-if="isHttpTab">
        <el-table :data="currentSubs" stripe style="width: 100%" v-if="currentSubs.length">
            <el-table-column prop="domain" label="订阅域名" />
            <el-table-column fixed="right" label="操作" width="120">
                <template #default="{ row }">
                    <el-button link type="primary" size="small"
                        @click="cookieRegStore.unReg(currentDomain!, row.domain)">删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-empty description="暂无数据" size="small" v-else />
    </el-card>

    <el-card :style="{ marginTop: '15px' }">
        <template #header>
            <div>
                所有订阅
                <el-switch v-model="subViewType"
                    style="--el-switch-on-color: #ff4949; --el-switch-off-color: #13ce66; float: right;"
                    active-text="被订阅者视图" inactive-text="订阅者视图" />
            </div>
        </template>
        <el-collapse accordion v-if="allSubSourceByViewTypeSortedKeys.length">
            <el-collapse-item v-for="(domain) in allSubSourceByViewTypeSortedKeys" :key="domain"
                :title="`${domain} (${allSubSourceByViewType[domain].subscribers.length})`">
                <el-card>
                    <el-table :data="allSubSourceByViewType[domain].subscribers" stripe style="width: 100%">
                        <el-table-column prop="domain" label="域名" fixed min-width="140" show-overflow-tooltip />
                        <el-table-column fixed="right" width="140">
                            <template #header>
                                操作
                            </template>
                            <template #default="{ row }">
                                <el-button link type="primary" size="small"
                                    @click="unRegWrapper(row.domain, domain as string)">
                                    删除
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-collapse-item>
        </el-collapse>
        <el-empty description="暂无数据" size="small" v-else />
    </el-card>
</template>