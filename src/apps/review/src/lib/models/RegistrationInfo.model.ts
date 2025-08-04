import { getRatingColor } from '~/libs/core'

import { BackendResource } from './BackendResource.model'

/**
 * Challenge registration info
 */
export interface RegistrationInfo extends BackendResource {
    handleColor?: string // this field is calculated at frontend
}

/**
 * Update challenge registration info to show in ui
 * @param data data from backend response
 * @returns updated data
 */
export function adjustRegistrationInfo(
    data: BackendResource | undefined,
): RegistrationInfo | undefined {
    if (!data) {
        return data
    }

    return {
        ...data,
        handleColor: getRatingColor(data.rating),
    }
}
