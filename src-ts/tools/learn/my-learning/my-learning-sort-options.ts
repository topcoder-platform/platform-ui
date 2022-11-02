export interface SortOption {
    label: string,
    value: string,
}

const COMPLETED_SORT_OPTIONS: ReadonlyArray<SortOption> = [
    {label: 'Completion date: new to old', value: '-completedDate'},
    {label: 'Completion date: old to new', value: 'completedDate'},
]

const IN_PROGRESS_SORT_OPTIONS: ReadonlyArray<SortOption> = [
    {label: 'Recent activity: new to old', value: '-updatedAt'},
    {label: 'Recent activity: old to new', value: 'updatedAt'},
    {label: 'Most progress', value: '-courseProgressPercentage'},
    {label: 'Least progress', value: 'courseProgressPercentage'},
    {label: 'Name', value: 'certification'},
    // {label: 'Length', field: (c: ), direction: 'asc'},
]

export const sortOptions: {
    completed: ReadonlyArray<SortOption>,
    inProgress: ReadonlyArray<SortOption>
} = {
    completed: COMPLETED_SORT_OPTIONS,
    inProgress: IN_PROGRESS_SORT_OPTIONS,
}
