export const extractTermId = (termsUrl?: string): string | undefined => {
    if (!termsUrl) {
        return undefined
    }

    const trimmed = termsUrl.trim()
    if (!trimmed) {
        return undefined
    }

    try {
        const parsed = new URL(trimmed)
        const parts = parsed.pathname.split('/')
            .filter(Boolean)
        return parts[parts.length - 1]
    } catch {
        const parts = trimmed.split('/')
            .filter(Boolean)
        return parts[parts.length - 1]
    }
}
