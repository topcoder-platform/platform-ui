import type { AxiosInstance } from 'axios'

import { EnvironmentConfig } from '~/config'
import { xhrCreateInstance, xhrGetAsync } from '~/libs/core/lib/xhr'

export type ReportParameter = {
    name: string
    type: 'string' | 'string[]' | 'number' | 'number[]' | 'boolean' | 'date' | 'enum' | 'enum[]'
    description?: string
    required?: boolean
    location?: 'query' | 'path'
    options?: string[]
}

export type ReportDefinition = {
    name: string
    path: string
    description?: string
    method: string
    parameters?: ReportParameter[]
}

export type ReportGroup = {
    label: string
    basePath: string
    reports: ReportDefinition[]
}

export type ReportsIndexResponse = Record<string, ReportGroup>

const reportsDownloadClient: AxiosInstance = xhrCreateInstance()

const buildReportUrl = (path: string): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${EnvironmentConfig.API.V6}/reports${normalizedPath}`
}

export const fetchReportsIndex = async (): Promise<ReportsIndexResponse> => (
    xhrGetAsync<ReportsIndexResponse>(`${EnvironmentConfig.API.V6}/reports/directory`)
)

const downloadReportBlob = async (path: string, accept: string): Promise<Blob> => {
    if (!path) {
        throw new Error('Report path is required')
    }

    const url = buildReportUrl(path)
    const response = await reportsDownloadClient.get<Blob>(url, {
        headers: {
            Accept: accept,
        },
        responseType: 'blob',
    })

    return response.data
}

export const downloadReportAsJson = (path: string): Promise<Blob> => (
    downloadReportBlob(path, 'application/json')
)

export const downloadReportAsCsv = (path: string): Promise<Blob> => (
    downloadReportBlob(path, 'text/csv')
)

/**
 * Triggers a browser download for a report blob.
 * @param blob the report data returned from the reports API.
 * @param fileName the file name to present in the browser download prompt.
 * @returns nothing. The helper is used by the admin reports pages after a blob response is received.
 * @throws Does not throw intentionally. Browser download failures surface from the underlying DOM APIs.
 */
export const downloadBlobFile = (blob: Blob, fileName: string): void => {
    const link = document.createElement('a')
    const url = window.URL.createObjectURL(blob)

    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
}
