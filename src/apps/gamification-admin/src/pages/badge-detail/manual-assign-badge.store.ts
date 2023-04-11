import { EnvironmentConfig } from '~/config'
import { xhrPostAsync } from '~/libs/core'

export async function submitRequestAsync(csv: string): Promise<any> {
    const url: string = `${EnvironmentConfig.API.V5}/gamification/badges/assign`

    const form: any = new FormData()

    // fill the form
    form.append('file', new Blob([csv], { type: 'text/csv' }), 'data.csv')

    return xhrPostAsync(url, form, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}
