import { STORE_KEY, type RegStore } from "@/stores/cookieReg/type";
import { OnChangedCause, onCookieChanged, removeCookie, setCookie, type CookieChangeInfo } from "@/utils/cookies";
import { getItemData } from "@/utils/storage";

onCookieChanged((changeInfo: CookieChangeInfo) => {
    processCookieSubscribe(changeInfo)
})

// 处理 cookie 变更后的订阅通知
async function processCookieSubscribe(changeInfo: CookieChangeInfo) {
    const { cookie, cause, removed } = changeInfo
    const { domain } = cookie
    const register: RegStore = await getItemData(STORE_KEY, {})
    const subscriberInfo = register[domain]
    if (subscriberInfo) {
        const { subscribers } = subscriberInfo
        let isRemove = false
        switch (cause) {
            case OnChangedCause.evicted:
            case OnChangedCause.expired:
            case OnChangedCause.expired_overwrite: {
                // 移除
                isRemove = true
                break
            }
            case OnChangedCause.explicit:
            case OnChangedCause.overwrite: {
                isRemove = removed
                break
            }
        }
        if (isRemove) {
            subscribers.map(sub => removeCookie({ ...cookie, domain: sub.domain }))
        } else {
            subscribers.map(sub => setCookie({ ...cookie, domain: sub.domain }))
        }
    }
}