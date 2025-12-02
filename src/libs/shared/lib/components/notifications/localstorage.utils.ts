const lsKeyPrefix = 'notificationDismissed'

export const wasDismissed = (id: string): boolean => (
    (localStorage.getItem(`${lsKeyPrefix}[${id}]`)) !== null
)

export const dismiss = (id: string): void => {
    localStorage.setItem(`${lsKeyPrefix}[${id}]`, JSON.stringify(true))
}
