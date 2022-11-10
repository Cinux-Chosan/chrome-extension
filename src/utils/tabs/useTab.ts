import { computed, ref } from "vue"
import { getUrlDomain } from "../common"
import { getCurrentTab, onTabChanged } from "./tabs"

export function useTabs() {

    const currentTab = ref<chrome.tabs.Tab>()

    const currentUrl = computed(() => currentTab.value?.url)

    const currentDomain = computed(() => getUrlDomain(currentUrl.value))

    const isHttpTab = computed(() => !!currentUrl.value?.match(/^https?:\/\//))

    const updateTab = async () => currentTab.value = await getCurrentTab()

    onTabChanged(() => updateTab())

    updateTab()

    return {
        currentTab,
        currentUrl,
        currentDomain,
        isHttpTab
    }
}
const tabInfo = useTabs()

export default tabInfo