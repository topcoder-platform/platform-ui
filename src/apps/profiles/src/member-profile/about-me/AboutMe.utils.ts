export interface TruncatedBio {
    isTruncated: boolean
    text: string
}

export const PROFILE_BIO_TRUNCATION_LENGTH = 195

/**
 * Returns profile bio text for the collapsed AboutMe view.
 *
 * Used by the member profile page to keep the collapsed left-column bio
 * preview compact while preserving full words when possible. The returned text
 * includes the trailing three-dot suffix only when the bio exceeds the
 * configured limit.
 *
 * @param {string | undefined} bio - The full profile bio from the member profile API.
 * @param {number} maxLength - Maximum visible characters before the suffix is added.
 * @returns {TruncatedBio} Display text and whether the full bio was shortened.
 * @throws This function does not raise exceptions.
 */
export const getTruncatedBio = (
    bio: string | undefined,
    maxLength: number = PROFILE_BIO_TRUNCATION_LENGTH,
): TruncatedBio => {
    const text = bio?.trim() ?? ''
    const safeMaxLength = Math.max(0, maxLength)

    if (text.length <= safeMaxLength) {
        return {
            isTruncated: false,
            text,
        }
    }

    const textAtLimit = text.slice(0, safeMaxLength)
        .trimEnd()

    if (!textAtLimit) {
        return {
            isTruncated: true,
            text: '...',
        }
    }

    if (/\s/.test(text.charAt(safeMaxLength))) {
        return {
            isTruncated: true,
            text: `${textAtLimit}...`,
        }
    }

    let wordBoundaryIndex = textAtLimit.length

    while (wordBoundaryIndex > 0 && !/\s/.test(textAtLimit.charAt(wordBoundaryIndex - 1))) {
        wordBoundaryIndex -= 1
    }

    const wordBoundedText = wordBoundaryIndex > 0
        ? textAtLimit.slice(0, wordBoundaryIndex)
            .trimEnd()
        : textAtLimit

    return {
        isTruncated: true,
        text: `${wordBoundedText}...`,
    }
}
