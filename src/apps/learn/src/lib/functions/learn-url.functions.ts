import { LearnConfig } from '../../config'

export function get(...parts: Array<string>): string {
    return [
        LearnConfig.API,
        ...parts,
    ]
        .filter(Boolean)
        .join('/')
}
