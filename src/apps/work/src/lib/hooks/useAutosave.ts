import { useEffect, useMemo, useRef, useState } from 'react'
import cloneDeep from 'lodash/cloneDeep'
import debounce from 'lodash/debounce'
import isEqual from 'lodash/isEqual'

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
    const lastQueuedValuesRef = useRef<T | undefined>()
    const lastSavedValuesRef = useRef<T | undefined>()
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
                lastSavedValuesRef.current = cloneDeep(values)
                setSaveStatus('saved')
            } catch {
                setSaveStatus('error')
            }
        }, delay),
        [delay],
    )

    useEffect(() => {
        if (!enabled) {
            debouncedSave.cancel()
            lastQueuedValuesRef.current = undefined
            isInitialRender.current = false
            return undefined
        }

        if (isInitialRender.current) {
            isInitialRender.current = false
            return undefined
        }

        if (
            saveStatus === 'saved'
            && lastSavedValuesRef.current !== undefined
            && !isEqual(lastSavedValuesRef.current, formValues)
        ) {
            setSaveStatus('idle')
        }

        if (
            lastQueuedValuesRef.current !== undefined
            && isEqual(lastQueuedValuesRef.current, formValues)
        ) {
            return undefined
        }

        lastQueuedValuesRef.current = cloneDeep(formValues)
        debouncedSave(formValues)

        return undefined
    }, [debouncedSave, enabled, formValues, saveStatus])

    useEffect(() => () => {
        debouncedSave.cancel()
    }, [debouncedSave])

    return {
        lastSaved,
        saveStatus,
    }
}
