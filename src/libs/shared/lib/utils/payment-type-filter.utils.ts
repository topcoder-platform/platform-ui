export const PAYMENT_TYPE_CATEGORY_BY_FILTER_VALUE: Record<string, string> = {
    Contest: 'CONTEST_PAYMENT',
    Copilot: 'COPILOT_PAYMENT',
    Engagement: 'ENGAGEMENT_PAYMENT',
    'Review Board': 'REVIEW_BOARD_PAYMENT',
    Task: 'TASK_PAYMENT',
}

export const PAYMENT_TYPE_FILTER_VALUE_BY_CATEGORY: Record<string, string> = Object.fromEntries(
    Object.entries(PAYMENT_TYPE_CATEGORY_BY_FILTER_VALUE)
        .map(([filterValue, category]) => [category, filterValue]),
)

export function toPaymentTypeFilterValues(categories: string[]): string[] {
    return categories.map(category => PAYMENT_TYPE_FILTER_VALUE_BY_CATEGORY[category] ?? category)
}

export function toPaymentTypeCategories(filterValues: string[]): string[] {
    return filterValues.map(value => PAYMENT_TYPE_CATEGORY_BY_FILTER_VALUE[value] ?? value)
}
