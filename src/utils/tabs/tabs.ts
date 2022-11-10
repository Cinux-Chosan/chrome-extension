import { computed, ref } from "vue"

export async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true })
    return tab
}

export async function onTabChanged(callback: (tabActiveInfo: chrome.tabs.TabActiveInfo) => void) {
    chrome.tabs.onActivated.addListener(callback)
}

