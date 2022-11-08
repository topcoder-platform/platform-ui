import { Dispatch, SetStateAction, useCallback, useState } from 'react'

type StorageTypes = 'localStorage' | 'sessionStorage'

export function useStorage<T>(
    storageType: StorageTypes,
    storageKey: string,
    initialValue?: T,
): [T, Dispatch<SetStateAction<T>>] {
    const storage: Storage = window[storageType]

    const readStoredValue: () => T = useCallback(() => {
        try {
            // Get from local storage by key
            const item: string | null = storage.getItem(storageKey)
            // Parse stored json or if none return initialValue
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            // If error also return value
            return initialValue
        }
    }, [storage, storageKey, initialValue])

    // State to store our value
    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue]: [T, Dispatch<SetStateAction<T>>] = useState(readStoredValue())

    // Return a wrapped version of useState's setter function that
    // persists the new value to local or session storage.
    const setValue: Dispatch<SetStateAction<T>> = useCallback((value: T) => {
        try {
            // Allow value to be a function so we have same API as useState
            setStoredValue((storedv: T) => {
                const valueToStore: T = value instanceof Function ? value(storedv) : value

                if (valueToStore === undefined) {
                    storage.removeItem(storageKey)
                } else {
                    // Save to local storage
                    storage.setItem(storageKey, JSON.stringify(valueToStore))
                }

                return valueToStore
            })
        } catch (error) {
            // A more advanced implementation would handle the error case
            // tslint:disable-next-line:no-console
            console.error(error)
        }
    }, [storage, storageKey]) as Dispatch<SetStateAction<T>>

    return [storedValue, setValue]
}

export const useLocalStorage: <T, >(
    key: string,
    initialValue?: T
) => [T, Dispatch<SetStateAction<T>>] = <T>(
    key: string,
    initialValue?: T,
) => useStorage<T>('localStorage', key, initialValue)

export const useSessionStorage: <T, >(
    key: string,
    initialValue?: T
) => [T, Dispatch<SetStateAction<T>>] = <T>(
    key: string,
    initialValue?: T,
) => useStorage<T>('sessionStorage', key, initialValue)
