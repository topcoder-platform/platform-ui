export const wasDismissed = (id: string): boolean => (
    (localStorage.getItem(`dismissed[${id}]`)) !== null
)

export const dismiss = (id: string): void => {
    localStorage.setItem(`dismissed[${id}]`, JSON.stringify(true))
}
