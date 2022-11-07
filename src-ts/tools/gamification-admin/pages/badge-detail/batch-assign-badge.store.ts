import { EnvironmentConfig } from '../../../../config'
import { xhrPostAsync } from '../../../../lib'

export async function submitRequestAsync(batchFile: File): Promise<any> {
    const url: string = `${EnvironmentConfig.API.V5}/gamification/badges/assign`

    const form: any = new FormData()

    // fill the form
    form.append('file', batchFile)

    return xhrPostAsync(url, form, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}
