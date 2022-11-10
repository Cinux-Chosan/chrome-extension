
export const STORE_KEY = 'useCookieReg_register'

export type RegStore = {
    [k: string]: {
        subscribers: {
            domain: string
        }[]
    }
}