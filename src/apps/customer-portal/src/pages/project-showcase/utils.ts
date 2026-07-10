import { Challenge } from '~/apps/work/src/lib'

export const getTrackName = (challenge: Challenge): string => (
    (typeof challenge.track === 'string'
        ? challenge.track as string
        : challenge.track?.name)
        ?? (typeof challenge.type === 'string'
            ? challenge.type as string
            : challenge.type?.name)
        ?? 'Challenge'
)

export const toClassName = (cls: string): string => (
    cls.toLowerCase()
        .replace(/\W+/g, '_')
)
