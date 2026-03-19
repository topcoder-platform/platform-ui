export function getRatingLevel(rating: number): string {
    const normalizedRating = Number.isFinite(rating)
        ? rating
        : 0

    if (normalizedRating < 900) {
        return 'level-1'
    }

    if (normalizedRating < 1200) {
        return 'level-2'
    }

    if (normalizedRating < 1500) {
        return 'level-3'
    }

    if (normalizedRating < 2200) {
        return 'level-4'
    }

    return 'level-5'
}
