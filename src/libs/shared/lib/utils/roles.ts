import { preferredRoleOptions } from '../constants'

export function getPreferredRoleLabelByValue(value: string): string {
    return preferredRoleOptions
        .find(each => each.value === value)?.label as string
}
