export function throwError(e: string): never {
    throw new Error(e)
}

export function getUrlDomain(url?: string) {
    return url?.match(/^(https?:\/\/)?([^:/]*)/)?.[2]?.toLocaleLowerCase()
}