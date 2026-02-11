import { useEffect, useMemo, useRef, useState } from 'react'
import debounce from 'lodash/debounce'

import { AUTOSAVE_DELAY_MS } from '../constants/challenge-editor.constants'

export type AutosaveStatus = 'error' | 'idle' | 'saved' | 'saving'

interface UseAutosaveParams<T> {
    delay?: number
    enabled?: boolean
    formValues: T
    onSave: (values: T) => Promise<void>
}

export interface UseAutosaveResult {
    lastSaved?: Date
    saveStatus: AutosaveStatus
}

export function useAutosave<T>(
    {
        delay = AUTOSAVE_DELAY_MS,
        enabled = true,
        formValues,
        onSave,
    }: UseAutosaveParams<T>,
): UseAutosaveResult {
    const [lastSaved, setLastSaved] = useState<Date | undefined>()
    const [saveStatus, setSaveStatus] = useState<AutosaveStatus>('idle')
    const isInitialRender = useRef<boolean>(true)
    const onSaveRef = useRef<(values: T) => Promise<void>>(onSave)

    useEffect(() => {
        onSaveRef.current = onSave
    }, [onSave])

    const debouncedSave = useMemo(
        () => debounce(async (values: T) => {
            setSaveStatus('saving')

            try {
                await onSaveRef.current(values)
                setLastSaved(new Date())
                setSaveStatus('saved')
            } catch {
                setSaveStatus('error')
            }
        }, delay),
        [delay],
    )

    useEffect(() => {
        if (!enabled) {
            return undefined
        }

        if (isInitialRender.current) {
            isInitialRender.current = false
            return undefined
        }

        debouncedSave(formValues)

        return () => {
            debouncedSave.cancel()
        }
    }, [debouncedSave, enabled, formValues])

    return {
        lastSaved,
        saveStatus,
    }
}
