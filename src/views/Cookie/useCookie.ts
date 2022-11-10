import { removeCookie, setCookiesByUrl, updateCookieField, type Cookie, } from "@/utils/cookies";
import tabInfo from '@/utils/tabs/useTab'
import { ElMessage } from 'element-plus'
import { useCookieRegStore } from "@/stores/cookieReg";
import cookiesUse from "@/utils/cookies/useCookies";

const { currentUrl, currentDomain, isHttpTab } = tabInfo
const { cookiesByDomain, isLoading } = cookiesUse
const cookieRegStore = useCookieRegStore()

export function localUseCookies() {

    const applyToCurrent = async (domain: string) => {
        if (isHttpTab.value) {
            if (domain === currentDomain.value) return;
            const cookieList = cookiesByDomain.value[domain]
            setCookiesByUrl(currentUrl.value!, cookieList as Cookie[])
        } else {
            ElMessage.warning(`当前页面无法应用该 cookie，请切换到正常网页！`)
        }
    }

    // 将对应的域名绑定到当前的域名，并在发生变化后自动同步
    const bindToCurrent = async (domain: string) => {
        if (isHttpTab.value) {
            return cookieRegStore.reg(currentDomain.value!, domain)
        } else {
            ElMessage.warning(`当前页面无法订阅该 cookie，请切换到正常网页！`)
        }
    }

    const updateField = <T extends keyof Cookie>(key: string, index: number, fieldName: T, newValue: Cookie[T], oldValue: Cookie[T]) => {
        const cookie = cookiesByDomain.value[key][index]
        Object.assign(cookie, { [fieldName]: newValue })
        updateCookieField(cookie, fieldName, newValue, oldValue)
    }
    const delCookieItem = async (domain: string, index: number) => {
        const cookie = cookiesByDomain.value[domain][index]
        return removeCookie(cookie)
    }

    const delAllCookie = (domain: string) => cookiesByDomain.value[domain].map(cookie => removeCookie(cookie))

    return {
        cookiesByDomain,
        isLoading,
        applyToCurrent,
        bindToCurrent,
        updateField,
        delCookieItem,
        delAllCookie,
    }
}


const cookieUse = localUseCookies()

export default cookieUse