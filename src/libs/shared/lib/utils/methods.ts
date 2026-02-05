export function upsertTrait<T extends object>(
    key: keyof T | string,
    value: any,
    data: T[] = [],
): T[] {
    const filtered = data.filter(item => !(key in item))
    return [...filtered, { [key]: value } as T]
}
