export const ALL_CERTIFICATIONS_SORT_ENUM: {
    category: string,
    createdAt: string,
    title: string,
} = {
    category: 'Category',
    createdAt: 'Newest',
    title: 'Title',
}

export type ALL_CERTIFICATIONS_SORT_FIELD_TYPE = keyof typeof ALL_CERTIFICATIONS_SORT_ENUM

export const ALL_CERTIFICATIONS_SORT_OPTIONS: Array<{label: string, value: ALL_CERTIFICATIONS_SORT_FIELD_TYPE, }> = Object.entries(
    ALL_CERTIFICATIONS_SORT_ENUM
).map(([value, label]) => ({value: value as ALL_CERTIFICATIONS_SORT_FIELD_TYPE, label}))

export const ALL_CERTIFICATIONS_SORT_FIELDS: Array<ALL_CERTIFICATIONS_SORT_FIELD_TYPE> = Object.keys(ALL_CERTIFICATIONS_SORT_ENUM) as Array<ALL_CERTIFICATIONS_SORT_FIELD_TYPE>
export const ALL_CERTIFICATIONS_DEFAULT_SORT: ALL_CERTIFICATIONS_SORT_FIELD_TYPE = ALL_CERTIFICATIONS_SORT_OPTIONS[0].value
