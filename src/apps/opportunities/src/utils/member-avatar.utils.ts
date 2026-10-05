/**
 * Placeholder avatar color pairs authored in the Opportunities Figma
 * ("Placeholder based on initials"). Each name maps to a background and
 * initial color in `MemberAvatar.module.scss`; the order is part of the
 * handle-to-color contract, so append new palettes instead of reordering.
 */
export const MEMBER_AVATAR_PALETTES = [
    'green',
    'teal',
    'blue',
    'purple',
    'magenta',
    'orange',
    'yellow',
    'gray',
] as const

export type MemberAvatarPalette = typeof MEMBER_AVATAR_PALETTES[number]

/** Largest 31-bit prime, keeping the rolling hash within safe integer range. */
const HASH_MODULUS = 2147483647

/**
 * Normalizes a member handle for placeholder rendering.
 *
 * @param handle member handle, possibly untrimmed or missing.
 * @returns trimmed handle, or an empty string when unavailable.
 * @throws Does not throw.
 */
function normalizeHandle(handle?: string): string {
    return typeof handle === 'string' ? handle.trim() : ''
}

/**
 * Resolves the single uppercase initial shown when a member has no photo.
 * Used by `MemberAvatar` across challenge, forum, winner, and review views.
 *
 * @param handle member handle.
 * @returns first character of the trimmed handle in uppercase, or an empty
 * string when no handle is available.
 * @throws Does not throw.
 */
export function getMemberAvatarInitial(handle?: string): string {
    const [first = ''] = Array.from(normalizeHandle(handle))
    return first.toUpperCase()
}

/**
 * Picks the placeholder color pair for a member handle. The choice is stable
 * and case-insensitive, so a member keeps the same color on every page and
 * across sessions. `MemberAvatar` uses it whenever a photo is missing or fails.
 *
 * @param handle member handle.
 * @returns one of `MEMBER_AVATAR_PALETTES`; `gray` when no handle is available.
 * @throws Does not throw.
 */
export function getMemberAvatarPalette(handle?: string): MemberAvatarPalette {
    const normalized = normalizeHandle(handle)
        .toLowerCase()
    if (!normalized) return 'gray'

    const hash = Array.from(normalized)
        .reduce((total, char) => ((total * 31) + (char.codePointAt(0) ?? 0)) % HASH_MODULUS, 0)
    return MEMBER_AVATAR_PALETTES[hash % MEMBER_AVATAR_PALETTES.length]
}
