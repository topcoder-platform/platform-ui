import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { xhrGetAsync } from '~/libs/core'

export interface ModalContentResponse {
    content: string | undefined
}

export function useFetchModalContent(contentUrl?: string, enabled?: boolean): ModalContentResponse {
    const [content, setContent]: [string|undefined, Dispatch<SetStateAction<string|undefined>>] = useState()

    useEffect(() => {
        if (!contentUrl || !enabled) {
            return
        }

        if (!content) {
            xhrGetAsync<string>(contentUrl)
                .then(setContent)
        }
    }, [contentUrl, content, enabled])

    return { content }
}
