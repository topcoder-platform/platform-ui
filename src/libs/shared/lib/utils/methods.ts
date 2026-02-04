import { UserTrait } from '~/libs/core'

export function upsertTrait(
    key: string,
    value: any,
    data: UserTrait[] = [],
): UserTrait[] {
    return [
        ...data.filter(trait => !trait[key]),
        { [key]: value },
    ]
}
