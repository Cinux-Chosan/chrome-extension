import { forIn, groupBy } from "lodash"
import { computed, ref } from "vue"
import { onCookieChangedDebounced, queryAllCookies, type Cookie } from "."

export function useCookies() {
    const cookies = ref<Cookie[]>([])
    // 首次加载 loading
    const isLoading = ref(true)
    const cookiesByDomain = computed(() => {
        const cookiesByDomain = groupBy(cookies.value, cookieItem => cookieItem.domain)
        forIn(cookiesByDomain, i => i.sort((a, b) => a.name.toUpperCase().localeCompare(b.name.toUpperCase())))
        return cookiesByDomain
    })

    const updateCookies = async () => cookies.value = await queryAllCookies()

    onCookieChangedDebounced(() => updateCookies())

    setTimeout(() => updateCookies().finally(() => isLoading.value = false));

    return {
        cookies,
        cookiesByDomain,
        isLoading,
    }
}

const cookiesCuse = useCookies()

export default cookiesCuse