import type { AxiosInstance } from 'axios'

import { EnvironmentConfig } from '~/config'
import { xhrCreateInstance, xhrGetAsync } from '~/libs/core/lib/xhr'

export type ReportDefinition = {
    name: string
    path: string
    description?: string
    method: string
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
    xhrGetAsync<ReportsIndexResponse>(`${EnvironmentConfig.API.V6}/reports`)
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
