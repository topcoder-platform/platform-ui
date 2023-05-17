import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

import { tokenGetAsync, TokenModel } from '../../auth'

// initialize the global instance when this singleton is loaded
export const globalInstance: AxiosInstance = createInstance()

export function createInstance(): AxiosInstance {

    // create the instance
    const created: AxiosInstance = axios.create({
        headers: {
            'Content-Type': 'application/json',
        },
    })

    // add the interceptors
    interceptAuth(created)
    interceptError(created)

    return created
}

export async function deleteAsync<T>(url: string, xhrInstance: AxiosInstance = globalInstance): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.delete(url)
    return output.data
}

export async function getAsync<T>(url: string, xhrInstance: AxiosInstance = globalInstance): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.get(url)
    return output.data
}

export async function getBlobAsync<T>(url: string, xhrInstance: AxiosInstance = globalInstance): Promise<T> {
    const output: AxiosResponse<T> = await xhrInstance.get(url, { responseType: 'blob' })
    return output.data
}

export async function patchAsync<T, R>(url: string, data: T, xhrInstance: AxiosInstance = globalInstance): Promise<R> {
    const output: AxiosResponse<R> = await xhrInstance.patch(url, data)
    return output.data
}

export async function postAsync<T, R>(
    url: string,
    data: T,
    config?: AxiosRequestConfig<T>,
    xhrInstance: AxiosInstance = globalInstance,
): Promise<R> {
    const output: AxiosResponse<R> = await xhrInstance.post(url, data, config)
    return output.data
}

export async function putAsync<T, R>(
    url: string,
    data: T,
    config?: AxiosRequestConfig<T>,
    xhrInstance: AxiosInstance = globalInstance,
): Promise<R> {
    const output: AxiosResponse<R> = await xhrInstance.put(url, data, config)
    return output.data
}

function interceptAuth(instance: AxiosInstance): void {

    // add the auth token to all xhr calls
    instance.interceptors.request.use(async config => {
        const tokenData: TokenModel = await tokenGetAsync()
        
        //TODO: REMOVE THIS SHIT
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik5VSkZORGd4UlRVME5EWTBOVVkzTlRkR05qTXlRamxETmpOQk5UYzVRVUV3UlRFeU56TTJRUSJ9.eyJpc3MiOiJodHRwczovL3RvcGNvZGVyLWRldi5hdXRoMC5jb20vIiwic3ViIjoiakdJZjJwZDNmNDRCMWpxdk9haTMwQklLVFphbllCZlVAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vbTJtLnRvcGNvZGVyLWRldi5jb20vIiwiaWF0IjoxNjg0Mjk3NDgxLCJleHAiOjE2ODQzODM4ODEsImF6cCI6ImpHSWYycGQzZjQ0QjFqcXZPYWkzMEJJS1RaYW5ZQmZVIiwic2NvcGUiOiJ1cGRhdGU6dXNlcl9wcm9maWxlcyB3cml0ZTp1c2VyX3Byb2ZpbGVzIGNyZWF0ZTpjb25uZWN0X3Byb2plY3QgYWxsOmNoYWxsZW5nZXMgcmVhZDpjaGFsbGVuZ2VzIHdyaXRlOmNoYWxsZW5nZXMgYWxsOmdyb3VwcyB3cml0ZTpncm91cHMgcmVhZDpncm91cHMgdXBkYXRlOnN1Ym1pc3Npb24gcmVhZDpzdWJtaXNzaW9uIGRlbGV0ZTpzdWJtaXNzaW9uIGNyZWF0ZTpzdWJtaXNzaW9uIGFsbDpzdWJtaXNzaW9uIHVwZGF0ZTpyZXZpZXdfdHlwZSByZWFkOnJldmlld190eXBlIGRlbGV0ZTpyZXZpZXdfdHlwZSBhbGw6cmV2aWV3X3R5cGUgdXBkYXRlOnJldmlld19zdW1tYXRpb24gcmVhZDpyZXZpZXdfc3VtbWF0aW9uIGRlbGV0ZTpyZXZpZXdfc3VtbWF0aW9uIGNyZWF0ZTpyZXZpZXdfc3VtbWF0aW9uIGFsbDpyZXZpZXdfc3VtbWF0aW9uIHVwZGF0ZTpyZXZpZXcgcmVhZDpyZXZpZXcgZGVsZXRlOnJldmlldyBjcmVhdGU6cmV2aWV3IGFsbDpyZXZpZXcgcmVhZDpwcm9qZWN0IGFsbDpjb25uZWN0X3Byb2plY3QgcmVhZDpidXNfdG9waWNzIHdyaXRlOmJ1c19hcGkgcmVhZDplbWFpbF90ZW1wbGF0ZXMgcmVhZDp1c2VyX3Byb2ZpbGVzIHJlYWQ6cm9sZXMgcmVhZDpwcm9qZWN0LXVzZXIgcmVhZDpwcm9qZWN0LXBlcm1pc3Npb24gcmVhZDpyZXNvdXJjZXMgd3JpdGU6cmVzb3VyY2VzIGRlbGV0ZTpyZXNvdXJjZXMgdXBkYXRlOnJlc291cmNlcyBhbGw6cmVzb3VyY2VzIHJlYWQ6dGVybXMgYWxsOnRlcm1zIGFsbDpwcm9qZWN0cyByZWFkOnByb2plY3RzIGFsbDpza2lsbCBjcmVhdGU6c2tpbGwgYWxsOnNjaGVkdWxlcyByZWFkOnNjaGVkdWxlcyBjcmVhdGU6c2NoZWR1bGVzIHVwZGF0ZTpzY2hlZHVsZXMgZGVsZXRlOnNjaGVkdWxlcyByZWFkOnByb2plY3QtYmlsbGluZy1hY2NvdW50LWRldGFpbHMgY3JlYXRlOnRheG9ub215IGFsbDp0YXhvbm9teSBhbGw6Y3VzdG9tZXItcGF5bWVudHMgcmVhZDptYXRjaC1lbmdpbmUtbWVtYmVycyByZWFkOm1hdGNoLWVuZ2luZS1kb21haW5zIHJlYWQ6bWF0Y2gtZW5naW5lLXJvbGVzIHJlYWQ6bWF0Y2gtZW5naW5lLXNraWxscyByZWFkOm1hdGNoLWVuZ2luZS1qb2JzIHJlYWQ6ZW1zaS1za2lsbHMiLCJndHkiOiJjbGllbnQtY3JlZGVudGlhbHMifQ.SQbyGJMTUAT-zVTGxxnlUMoIGI-UoRAbKMpUBgNir3ZIQEMoG1SoXZoFGX9aNiIEvhO_9PVde14Y7Bl5Z7ghyoqMi9YwH4Hk8M9rnxdk6RMgYmnRjj7vQynFVIJZxY_HjIPai3oAA66vKsMu3V6ryHLQKNU1ZdDPnCXDWvDFsNcNyWtx79yTeVWalUi25M_kMOUKlsF2SMHBfl9FRKjAw-ZZmUuAdkKaOdLTRQbQYpYVVHA-J44e66vjLwTJDvYSQQlOo3peyucW54enUmqLwyvW1SIjLJFVmRnzviCDwBvgd7YXY_GhSkkfp-MnZx6jX5ZgB6RF3Rm9LxCOBZZ7xg`

        if (tokenData.token) {
            config.headers = config.headers || {}
            config.headers.Authorization = `Bearer ${tokenData.token}`
        }

        return config
    })
}

function interceptError(instance: AxiosInstance): void {

    // handle all http errors
    instance.interceptors.response.use(
        config => config,
        (error: any) => {

            // if there is server error message, then return it inside `message` property of error
            error.message = error?.response?.data?.message || error.message
            // if there is server errors data, then return it inside `errors` property of error
            error.errors = error?.response?.data?.errors

            return Promise.reject(error)
        },
    )
}
