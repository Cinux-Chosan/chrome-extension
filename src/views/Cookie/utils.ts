export function sortAndLift(a: string, b: string, c?: string) {
    a = a.toLocaleLowerCase()
    b = b.toLocaleLowerCase()
    const currentDomainValue = c?.toLocaleLowerCase()
    const currentDomainInA = currentDomainValue?.includes(a.replace(/^\./, '')) && -1
    const currentDomainInB = currentDomainValue?.includes(b.replace(/^\./, '')) && 1
    return currentDomainInA || currentDomainInB || a.replace(/^\./, '').localeCompare(b.replace(/^\./, ''))
}