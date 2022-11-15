import { getUrlDomain } from "../common";
import { groupBy, debounce } from 'lodash'

// export type SameSiteStatus = chrome.cookies.SameSiteStatus
export type Cookie = chrome.cookies.Cookie

export type CookieChangeInfo = chrome.cookies.CookieChangeInfo

// https://developer.chrome.com/docs/extensions/reference/cookies/#type-OnChangedCause
export enum OnChangedCause {
    evicted = "evicted", // 被垃圾回收移除
    expired = "expired", // 过期自动删除
    explicit = "explicit", // 插入或者调用 set 删除
    expired_overwrite = "expired_overwrite", // 被设置已经过期的时间导致删除
    overwrite = "overwrite" // 调用 set 被覆写
}

export enum SameSiteStatus {
    unspecified = 'unspecified',
    no_restriction = 'no_restriction',
    lax = 'lax',
    strict = 'strict'
}

export const SameSiteStatusMap = {
    [SameSiteStatus.unspecified]: '',
    [SameSiteStatus.lax]: 'Lax',
    [SameSiteStatus.strict]: 'Strict',
    [SameSiteStatus.no_restriction]: 'None',
}

// 根据 url 查询对应域名下的所有 cookie
export async function queryCookies(urlOrDomain: string) {
    const domain = getUrlDomain(urlOrDomain)
    const cookies = await chrome.cookies.getAll({ domain });
    return cookies;
}

export async function queryAllCookies() {
    return chrome.cookies.getAll({})
}

// 查询所有的 cookie 并且根据域名进行分组
export async function queryAllCookiesGroupByDomain() {
    const cookies = await chrome.cookies.getAll({})
    return groupBy(cookies, cookieItem => cookieItem.domain)
}

export async function setCookie(cookie: Cookie, url = formatUrlFromCookie(cookie)) {
    const { hostOnly, session, domain, ...rest } = cookie
    // https://stackoverflow.com/questions/62482934/how-to-set-cookie-with-chrome-extension-api-for-subdomain/74355939#74355939
    // 如果未指定 domain，则会根据 url 计算出 Host-only domain，即不带有点号前缀，只严格匹配 host
    // 但如果指定了 domain，则无论如何都是一个 subdmain，即带有点号前缀
    return chrome.cookies.set({ ...rest, domain: domain?.startsWith('.') ? domain : undefined, url })
}

export async function setCookiesByUrl(url: string, cookies: chrome.cookies.Cookie[]) {
    const domain = getUrlDomain(url)
    if (!domain) return [];
    return Promise.all(cookies.map(cookie => setCookie({ ...cookie, domain }, new URL(url).origin)))
}

export async function updateCookieField<T extends keyof Cookie>(cookie: Cookie, fieldName: T, newValue: Cookie[T], oldValue: Cookie[T]) {
    const _newValue = typeof newValue === 'string' ? newValue.trim() : newValue
    const _oldValue = typeof oldValue === 'string' ? oldValue.trim() : oldValue
    if (_newValue !== _oldValue) {
        // name 和 path 改变会插入新的 cookie，而非覆盖原来的 cookie，而如果是 secure 从 true 变为 false 会报错，因此直接统一删除旧的 cookie 重新插入 cookie
        await removeCookie({ ...cookie, [fieldName]: _oldValue })
        return setCookie({ ...cookie, [fieldName]: _newValue })
    }
}

export async function removeCookie(cookie: Cookie) {
    // https://stackoverflow.com/questions/62482934/how-to-set-cookie-with-chrome-extension-api-for-subdomain/74355939#74355939
    // 由于 chrome.cookies.remove 只能传递 url、name 和 storeId 三个参数，会同时删除 domain 和 subdomain
    // 因此我们只能借助 chrome.cookies.set 来强制对应的 cookie 过期，从而达到仅删除带前缀或不带前缀的域名的目的
    return setCookie({ ...cookie, expirationDate: 0 })
    // const url = formatUrlFromCookie(cookie)
    // const { name, storeId } = cookie
    // return chrome.cookies.remove({ url, name, storeId } as any)
}

export function formatUrlFromCookie(cookie: Partial<Cookie>) {
    const { secure, path = '', domain = '' } = cookie
    return `http${secure ? 's' : ''}://${domain?.replace(/^\./, '')}${path}`
}


export async function onCookieChanged(callback: (info: CookieChangeInfo) => void) {
    return chrome.cookies.onChanged.addListener(callback)
}
export async function onCookieChangedDebounced(callback: (info: CookieChangeInfo) => void) {
    const debouncedCallback = debounce(callback, 500, { maxWait: 5_000 })
    return chrome.cookies.onChanged.addListener(debouncedCallback)
}

export function cookieToString(cookie: Omit<Cookie, 'storeId'>) {
    const { domain, hostOnly, expirationDate, session, httpOnly, name, value, path, sameSite, secure } = cookie
    const _domain = domain // hostOnly ? domain : domain.startsWith('.') ? domain : `.${domain}`
    const _secure = secure ? 'Secure;' : ''
    const _httpOnly = httpOnly ? 'HttpOnly;' : ''
    const _expirationDate = session ? null : expirationDate && new Date(expirationDate * 1000)
    const _expires = _expirationDate ? `Expires=${_expirationDate.toUTCString()};` : ''
    const _sameSite = SameSiteStatusMap[sameSite] && `SameSite=${SameSiteStatusMap[sameSite]};`
    return `${name}=${value}; Path=${path}; Domain=${_domain}; ${_httpOnly} ${_secure} ${_expires} ${_sameSite}`.trim()
}

export function pruneCookie(cookie: Cookie) {
    const { expirationDate, hostOnly, session, storeId, sameSite, ...rest } = cookie
    return {
        expires: expirationDate ? new Date(expirationDate! * 1000).toUTCString() : undefined,
        sameSite: SameSiteStatusMap[sameSite] || undefined,
        ...rest
    }
}

export function cookieToJsonStr(cookie: Cookie) {
    return JSON.stringify(pruneCookie(cookie), null, 2)
}

export async function importCookiesStr(cookies: string) {
    let cookieList;
    try {
        cookieList = JSON.parse(cookies)
    } catch (error) {
        cookieList = cookies.split('\n').map(cookieStr => {
            // TODO: parse
        })
    } finally {
        if (Array.isArray(cookieList)) {
            await Promise.all(cookieList.map(cookie => {
                const { expires, ...rest } = cookie
                cookie.expirationDate = expires ? new Date(expires) : null
                setCookie(rest)
            }))
        }
    }
}