import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'

import { Button, InputSelect, InputSelectOption, LoadingSpinner, PageTitle } from '~/libs/ui'

import { PageContent, PageHeader } from '../lib'
import { handleError } from '../lib/utils'
import {
    downloadReportAsCsv,
    downloadReportAsJson,
    fetchReportsIndex,
    ReportDefinition,
    ReportGroup,
    ReportsIndexResponse,
} from '../lib/services'

import styles from './ReportsPage.module.scss'

const pageTitle = 'Reports'

const buildDownloadName = (name: string, extension: 'json' | 'csv'): string => {
    const normalized = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')

    const base = normalized || 'report'
    return `${base}.${extension}`
}

const formatMethod = (method?: string): string => (
    method ? method.toUpperCase() : 'GET'
)

export const ReportsPage: FC = () => {
    const [reportsIndex, setReportsIndex] = useState<ReportsIndexResponse>({})
    const [selectedBasePath, setSelectedBasePath] = useState<string>('')
    const [selectedReportPath, setSelectedReportPath] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [downloadingFormat, setDownloadingFormat] = useState<'json' | 'csv' | undefined>(undefined)

    useEffect(() => {
        let isMounted = true
        setIsLoading(true)

        fetchReportsIndex()
            .then(data => {
                if (!isMounted) return
                setReportsIndex(data ?? {})
            })
            .catch(error => {
                if (!isMounted) return
                handleError(error)
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false)
                }
            })

        return () => {
            isMounted = false
        }
    }, [])

    const basePathOptions = useMemo<InputSelectOption[]>(() => {
        const groups: ReportGroup[] = Object.values(reportsIndex ?? {})
        const options = groups.map(group => ({
            label: group.label || group.basePath,
            value: group.basePath,
        }))

        options.sort((a, b) => a.label.localeCompare(b.label))
        return options
    }, [reportsIndex])

    const selectedGroup = useMemo<ReportGroup | undefined>(() => (
        selectedBasePath
            ? Object.values(reportsIndex)
                .find(group => group.basePath === selectedBasePath)
            : undefined
    ), [reportsIndex, selectedBasePath])

    const reportOptions = useMemo<InputSelectOption[]>(() => {
        if (!selectedGroup?.reports?.length) {
            return []
        }

        const options = selectedGroup.reports.map(report => ({
            label: report.name,
            value: report.path,
        }))

        options.sort((a, b) => a.label.localeCompare(b.label))
        return options
    }, [selectedGroup])

    const selectedReport = useMemo<ReportDefinition | undefined>(() => (
        selectedGroup?.reports?.find(report => report.path === selectedReportPath)
    ), [selectedGroup, selectedReportPath])

    const handleBasePathChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setSelectedBasePath(event.target.value)
        setSelectedReportPath('')
    }, [])

    const handleReportChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setSelectedReportPath(event.target.value)
    }, [])

    const handleDownload = useCallback(async (format: 'json' | 'csv') => {
        if (!selectedReport) {
            return
        }

        try {
            setDownloadingFormat(format)

            const blob = format === 'json'
                ? await downloadReportAsJson(selectedReport.path)
                : await downloadReportAsCsv(selectedReport.path)

            const link = document.createElement('a')
            const fileName = buildDownloadName(selectedReport.name, format)
            const url = window.URL.createObjectURL(blob)

            link.href = url
            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()
            link.parentNode?.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            handleError(error)
        } finally {
            setDownloadingFormat(undefined)
        }
    }, [selectedReport])

    const isDownloading = downloadingFormat !== undefined

    const handleJsonDownload = useCallback(() => {
        handleDownload('json')
    }, [handleDownload])

    const handleCsvDownload = useCallback(() => {
        handleDownload('csv')
    }, [handleDownload])

    return (
        <>
            <PageHeader>
                <PageTitle>{pageTitle}</PageTitle>
            </PageHeader>
            <PageContent>
                <div className={styles.page}>
                    <p className={styles.instructions}>
                        Select a base path to view the available reports. After choosing a report, download
                        the data as JSON or CSV directly from the reports API.
                    </p>

                    {isLoading ? (
                        <div className={styles.spinnerWrapper}>
                            <LoadingSpinner />
                        </div>
                    ) : (
                        <>
                            {basePathOptions.length ? (
                                <div className={styles.selectors}>
                                    <InputSelect
                                        classNameWrapper={styles.select}
                                        label='Report category'
                                        name='reports-base-path'
                                        options={basePathOptions}
                                        placeholder='Select a base path'
                                        value={selectedBasePath}
                                        onChange={handleBasePathChange}
                                    />

                                    {selectedGroup && (
                                        <InputSelect
                                            classNameWrapper={styles.select}
                                            label='Report'
                                            name='reports-path'
                                            options={reportOptions}
                                            placeholder='Select a report'
                                            value={selectedReportPath}
                                            onChange={handleReportChange}
                                            disabled={!reportOptions.length}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    No reports are currently available.
                                </div>
                            )}

                            {selectedReport && (
                                <>
                                    <div className={styles.reportDetails}>
                                        <div className={styles.reportTitle}>{selectedReport.name}</div>
                                        {selectedReport.description && (
                                            <div className={styles.reportDescription}>
                                                {selectedReport.description}
                                            </div>
                                        )}
                                        <div className={styles.reportMeta}>
                                            {formatMethod(selectedReport.method)}
                                            {' '}
                                            {selectedReport.path}
                                        </div>
                                    </div>

                                    <div className={styles.actions}>
                                        <Button
                                            primary
                                            disabled={!selectedReport || isDownloading}
                                            onClick={handleJsonDownload}
                                        >
                                            {downloadingFormat === 'json'
                                                ? 'Downloading JSON…'
                                                : 'Download as JSON'}
                                        </Button>
                                        <Button
                                            secondary
                                            disabled={!selectedReport || isDownloading}
                                            onClick={handleCsvDownload}
                                        >
                                            {downloadingFormat === 'csv'
                                                ? 'Downloading CSV…'
                                                : 'Download as CSV'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </PageContent>
        </>
    )
}

export default ReportsPage
