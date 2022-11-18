import { watch } from 'vue'
import { defineStore } from 'pinia'
import { getItemData, setItem } from '@/utils/storage'
import { throttle } from 'lodash'
import { useAsyncState } from '@vueuse/core'
import { STORE_KEY, type RegStore } from './type'

export const useCookieRegStore = defineStore('useCookieReg', () => {

    const { state: register } = useAsyncState<RegStore, false>(getItemData(STORE_KEY, {}), {}, { shallow: false })

    const reg = (subscriberDomain: string, targetDomain: string) => {
        let targetStore = register.value[targetDomain]
        if (!targetStore) {
            targetStore = register.value[targetDomain] = {
                subscribers: []
            }
        }

        const exist = targetStore.subscribers.find(item => item.domain === subscriberDomain)

        if (!exist) {
            targetStore.subscribers.push({ domain: subscriberDomain })
        }
    }

    const unReg = (subscriberDomain: string, targetDomain: string) => {
        const registInfo = register.value[targetDomain]
        if (registInfo) {
            registInfo.subscribers = registInfo.subscribers.filter(({ domain }) => domain !== subscriberDomain)
            if (registInfo.subscribers.length <= 0) {
                delete register.value[targetDomain]
            }
        }
    }

    // 同步数据到 storage
    watch(register, throttle(val => setItem({ [STORE_KEY]: val }), 300, { trailing: true }), { deep: true })

    return {
        register,
        reg,
        unReg
    }
})
