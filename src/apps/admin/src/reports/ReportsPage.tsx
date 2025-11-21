import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'

import { Button, InputSelect, InputSelectOption, InputText, LoadingSpinner, PageTitle } from '~/libs/ui'

import { PageContent, PageHeader } from '../lib'
import { handleError } from '../lib/utils'
import {
    downloadReportAsCsv,
    downloadReportAsJson,
    fetchReportsIndex,
    ReportDefinition,
    ReportGroup,
    ReportParameter,
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
    const [parameterValues, setParameterValues] = useState<Record<string, string>>({})

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
        setParameterValues({})
    }, [])

    const handleReportChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setSelectedReportPath(event.target.value)
        setParameterValues({})
    }, [])

    const handleParameterChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        if (!event.target?.name) return

        setParameterValues(previous => ({
            ...previous,
            [event.target.name]: event.target.value,
        }))
    }, [])

    const createSelectParamChange = useCallback((name: string) => (
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        setParameterValues(previous => ({
            ...previous,
            [name]: event.target.value,
        }))
    }, [])

    const buildReportPathWithParams = useCallback((report: ReportDefinition): string => {
        let path = report.path
        const query = new URLSearchParams()
        const params: ReportParameter[] = report.parameters ?? []

        params.forEach(param => {
            const rawValue = parameterValues[param.name]
            if (rawValue === undefined || rawValue.trim() === '') {
                return
            }

            const isArray = param.type.endsWith('[]')
            const values = isArray
                ? rawValue.split(',')
                    .map(v => v.trim())
                    .filter(Boolean)
                : [rawValue.trim()]

            if (!values.length) return

            if (param.location === 'path') {
                path = path.replace(`:${param.name}`, encodeURIComponent(values[0]))
            } else {
                values.forEach(value => query.append(param.name, value))
            }
        })

        const queryString = query.toString()
        return queryString ? `${path}?${queryString}` : path
    }, [parameterValues])

    const handleDownload = useCallback(async (format: 'json' | 'csv') => {
        if (!selectedReport) {
            return
        }

        try {
            setDownloadingFormat(format)

            const requestPath = buildReportPathWithParams(selectedReport)

            const blob = format === 'json'
                ? await downloadReportAsJson(requestPath)
                : await downloadReportAsCsv(requestPath)

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
    }, [buildReportPathWithParams, selectedReport])

    const isDownloading = downloadingFormat !== undefined

    const requiredParamsMissing = useMemo(() => {
        const params = selectedReport?.parameters ?? []
        return params.some(param => param.required && !(parameterValues[param.name]?.trim()))
    }, [parameterValues, selectedReport])

    const hasUnresolvedPathParams = useMemo(() => (
        (selectedReport?.parameters ?? [])
            .filter(param => param.location === 'path')
            .some(param => !parameterValues[param.name]?.trim())
    ), [parameterValues, selectedReport])

    const isDownloadDisabled = !selectedReport || isDownloading || requiredParamsMissing || hasUnresolvedPathParams

    const handleJsonDownload = useCallback(() => {
        handleDownload('json')
    }, [handleDownload])

    const handleCsvDownload = useCallback(() => {
        handleDownload('csv')
    }, [handleDownload])

    const renderParameterInput = useCallback((parameter: ReportParameter) => {
        const commonProps = {
            label: parameter.name,
            name: parameter.name,
            placeholder: parameter.type.endsWith('[]') ? 'Comma-separated values' : 'Enter value',
        }

        if (parameter.type === 'boolean') {
            const options: InputSelectOption[] = [
                { label: 'True', value: 'true' },
                { label: 'False', value: 'false' },
            ]

            return (
                <InputSelect
                    {...commonProps}
                    options={options}
                    value={parameterValues[parameter.name] ?? ''}
                    onChange={createSelectParamChange(parameter.name)}
                />
            )
        }

        if (parameter.type === 'enum') {
            const options: InputSelectOption[] = (parameter.options ?? []).map(option => ({
                label: option,
                value: option,
            }))

            return (
                <InputSelect
                    {...commonProps}
                    options={options}
                    value={parameterValues[parameter.name] ?? ''}
                    onChange={createSelectParamChange(parameter.name)}
                />
            )
        }

        return (
            <InputText
                {...commonProps}
                value={parameterValues[parameter.name] ?? ''}
                onChange={handleParameterChange}
                type={parameter.type === 'number' ? 'number' : 'text'}
                hint={parameter.type === 'date' ? 'Use ISO format (e.g. 2024-01-31)' : undefined}
            />
        )
    }, [createSelectParamChange, handleParameterChange, parameterValues])

    return (
        <>
            <PageHeader>
                <PageTitle>{pageTitle}</PageTitle>
            </PageHeader>
            <PageContent>
                <div className={styles.page}>
                    <p className={styles.instructions}>
                        Select a base path to view the available reports. After choosing a report, provide any
                        required parameters and download the data as JSON or CSV directly from the reports API.
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

                                    {(selectedReport.parameters?.length ?? 0) > 0 && (
                                        <div className={styles.params}>
                                            {selectedReport.parameters?.map(parameter => (
                                                <div key={parameter.name}>
                                                    <div className={styles.paramLabel}>
                                                        {parameter.name}
                                                        {parameter.required ? ' *' : ''}
                                                    </div>
                                                    {parameter.description && (
                                                        <div className={styles.paramMeta}>{parameter.description}</div>
                                                    )}
                                                    <div className={styles.paramMeta}>
                                                        Location:
                                                        {' '}
                                                        {parameter.location || 'query'}
                                                        {' '}
                                                        • Type:
                                                        {' '}
                                                        {parameter.type}
                                                    </div>
                                                    {parameter.type.endsWith('[]') && (
                                                        <div className={styles.paramHint}>
                                                            Use comma-separated values for lists.
                                                        </div>
                                                    )}
                                                    {renderParameterInput(parameter)}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className={styles.actions}>
                                        <Button
                                            primary
                                            disabled={isDownloadDisabled}
                                            onClick={handleJsonDownload}
                                        >
                                            {downloadingFormat === 'json'
                                                ? 'Downloading JSON…'
                                                : 'Download as JSON'}
                                        </Button>
                                        <Button
                                            secondary
                                            disabled={isDownloadDisabled}
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
