import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { getCourseAsync } from './courses-functions'
import { CoursesProviderData } from './courses-provider-data.model'

export function useCoursesProvider(provider: string, certification?: string): CoursesProviderData {
    const [state, setState]: [CoursesProviderData, Dispatch<SetStateAction<CoursesProviderData>>] = useState<CoursesProviderData>({
        loading: false,
        ready: false,
    })

    useEffect(() => {
        if (!certification) {
            setState((prevState) => ({
                ...prevState,
                course: undefined,
                loading: false,
                ready: false,
            }))
            return
        }

        setState((prevState) => ({
            ...prevState,
            loading: true,
        }))

        getCourseAsync(provider, certification).then((course) => {
            setState((prevState) => ({
                ...prevState,
                course,
                loading: false,
                ready: true,
            }))
        })
    }, [provider, certification])

    return state
}
