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

const postReportBlob = async (
    path: string,
    data: Record<string, unknown> | FormData,
    accept: string,
    contentType: string,
): Promise<Blob> => {
    if (!path) {
        throw new Error('Report path is required')
    }

    const url = buildReportUrl(path)
    const response = await reportsDownloadClient.post<Blob>(url, data, {
        headers: {
            Accept: accept,
            'Content-Type': contentType,
        },
        responseType: 'blob',
    })

    return response.data
}

/**
 * Posts JSON payload to a report endpoint and returns the response body as a blob.
 * @param path Report path relative to `/reports`.
 * @param body Request payload, typically `{ handles: string[] }` for identity lookup endpoints.
 * @returns Blob response body.
 * @throws Error when report path is empty.
 */
export const postReportAsJson = (
    path: string,
    body: Record<string, unknown>,
): Promise<Blob> => (
    postReportBlob(path, body, 'application/json', 'application/json')
)

/**
 * Posts JSON payload to a report endpoint and requests CSV output.
 * @param path Report path relative to `/reports`.
 * @param body Request payload, typically `{ handles: string[] }` for identity lookup endpoints.
 * @returns Blob response body encoded as CSV.
 * @throws Error when report path is empty.
 */
export const postReportAsCsv = (
    path: string,
    body: Record<string, unknown>,
): Promise<Blob> => (
    postReportBlob(path, body, 'text/csv', 'application/json')
)

const createFileFormData = (file: File): FormData => {
    const formData = new FormData()
    formData.append('file', file)
    return formData
}

/**
 * Posts a text/csv file to a report endpoint and requests JSON output.
 * @param path Report path relative to `/reports`.
 * @param file Input file uploaded by the user.
 * @returns Blob response body.
 * @throws Error when report path is empty.
 */
export const postReportFileAsJson = (path: string, file: File): Promise<Blob> => (
    postReportBlob(path, createFileFormData(file), 'application/json', 'multipart/form-data')
)

/**
 * Posts a text/csv file to a report endpoint and requests CSV output.
 * @param path Report path relative to `/reports`.
 * @param file Input file uploaded by the user.
 * @returns Blob response body encoded as CSV.
 * @throws Error when report path is empty.
 */
export const postReportFileAsCsv = (path: string, file: File): Promise<Blob> => (
    postReportBlob(path, createFileFormData(file), 'text/csv', 'multipart/form-data')
)

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
 * @returns nothing. The helper is used by the reports pages after a blob response is received.
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
