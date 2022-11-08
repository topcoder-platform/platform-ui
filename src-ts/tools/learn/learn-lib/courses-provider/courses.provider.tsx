import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { courseGetAsync } from './courses-functions'
import { CoursesProviderData } from './courses-provider-data.model'

export function useCourses(provider: string, certification?: string): CoursesProviderData {

    const defaultProviderData: CoursesProviderData = {
        loading: false,
        ready: false,
    }

    const [state, setState]: [CoursesProviderData, Dispatch<SetStateAction<CoursesProviderData>>]
        = useState<CoursesProviderData>(defaultProviderData)

    useEffect(() => {

        let mounted: boolean = true

        if (!certification) {
            setState(prevState => ({
                ...prevState,
                course: undefined,
                loading: false,
                ready: false,
            }))
            return
        }

        setState(prevState => ({
            ...prevState,
            loading: true,
        }))

        courseGetAsync(provider, certification)
            .then(course => {
                if (!mounted) {
                    return
                }

                setState(prevState => ({
                    ...prevState,
                    course,
                    loading: false,
                    ready: true,
                }))
            })

        return () => {
            mounted = false
        }

    }, [provider, certification])

    return state
}
