


export async function setItem(data: { [k: string]: any }) {
    // chrome.storage.local.set 会将数组的 proxy 转换成对象，已经提交 bug report： https://bugs.chromium.org/p/chromium/issues/detail?id=1382651
    data = JSON.parse(JSON.stringify(data))
    return chrome.storage.local.set(data)
}

export async function getItem(keys?: string | string[] | { [key: string]: any } | null) {
    return chrome.storage.local.get(keys)
}

export async function getItemData<T>(key: string, defaultValue?: T): Promise<T> {
    return chrome.storage.local.get(key).then(r => r[key] || defaultValue)
}