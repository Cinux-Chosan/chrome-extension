import { removeCookie, SameSiteStatus, setCookie, setCookiesByUrl, updateCookieField, parseCookie, type Cookie, } from "@/utils/cookies";
import tabInfo from '@/utils/tabs/useTab'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCookieRegStore } from "@/stores/cookieReg";
import cookiesUse from "@/utils/cookies/useCookies";

const { currentUrl, currentDomain, isHttpTab } = tabInfo
const { cookiesByDomain, isLoading } = cookiesUse
const cookieRegStore = useCookieRegStore()

export function localUseCookies() {

    const applyToCurrent = async (domain: string) => {
        if (isHttpTab.value) {
            if (domain === currentDomain.value) return;
            await ElMessageBox.confirm(`应用后，域名 ${domain} 下的所有 cookie 将被设置到当前域名 ${currentDomain.value} 下`)
            const cookieList = cookiesByDomain.value[domain]
            setCookiesByUrl(currentUrl.value!, cookieList as Cookie[])
        } else {
            ElMessage.warning(`当前页面无法应用该 cookie，请切换到正常网页！`)
        }
    }

    // 将对应的域名绑定到当前的域名，并在发生变化后自动同步
    const bindToCurrent = async (domain: string) => {
        if (isHttpTab.value) {
            await ElMessageBox.confirm(`订阅后，域名 ${domain} 下的所有 cookie 变动将自动同步到当前域名 ${currentDomain.value} 下`)
            return cookieRegStore.reg(currentDomain.value!, domain)
        } else {
            ElMessage.warning(`当前页面无法订阅该 cookie，请切换到正常网页！`)
        }
    }

    const updateField = async <T extends keyof Cookie>(key: string, index: number, fieldName: T, newValue: Cookie[T], oldValue: Cookie[T]) => {
        try {
            const cookie = cookiesByDomain.value[key][index]
            const result = await updateCookieField(cookie, fieldName, newValue, oldValue)
            Object.assign(cookie, { [fieldName]: newValue })
            return result
        } catch (error) {
            ElMessage.error(`更新字段失败：${(error as Error).message || error}`)
        }
    }

    const delCookieItem = async (domain: string, index: number) => {
        await ElMessageBox.confirm(`请确认是否删除该 cookie`)
        const cookie = cookiesByDomain.value[domain][index]
        return removeCookie(cookie)
    }

    const delAllCookie = async (domain: string) => {
        await ElMessageBox.confirm(`请确认是否删除域名 ${domain} 下的所有 cookie`)
        cookiesByDomain.value[domain].map(cookie => removeCookie(cookie))
    }

    const importCookiesStr = async (cookies: string) => {
        let cookieList;
        try {
            // parse json cookies
            cookieList = JSON.parse(cookies)
            cookieList = Array.isArray(cookieList) ? cookieList : (cookieList && [cookieList])
        } catch (error) {
            // parse stringified cookies
            cookieList = cookies.split('\n').filter(Boolean).map(cookieStr => parseCookie(cookieStr))
        }

        if (Array.isArray(cookieList)) {
            return Promise.all(cookieList.filter(Boolean).map(cookie => {
                const { maxAge, expires, sameSite, ...rest } = cookie
                return setCookie({
                    ...rest,
                    expirationDate:
                        typeof maxAge === 'number' ?
                            Date.now() / 1000 + maxAge :
                            expires ?
                                new Date(expires).getTime() / 1000 :
                                undefined,
                    sameSite: ({
                        lax: SameSiteStatus.lax,
                        strict: SameSiteStatus.strict,
                        none: SameSiteStatus.no_restriction
                    } as any)[sameSite] || 'unspecified'
                })
            }))
        } else {
            // 解析错误
            throw new Error(`解析错误！`)
        }
    }

    return {
        cookiesByDomain,
        isLoading,
        applyToCurrent,
        bindToCurrent,
        updateField,
        delCookieItem,
        delAllCookie,
        importCookiesStr,
    }
}

const cookieUse = localUseCookies()

export default cookieUse