import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import {
    Button,
    IconOutline,
    InputSelect,
    InputSelectOption,
    InputText,
    LoadingSpinner,
    PageTitle,
    Tooltip,
} from '~/libs/ui'
import { Pagination } from '~/apps/admin/src/lib'

import { bulkMemberLookupRouteId } from '../../config/routes.config'
import { handleError } from '../../lib/utils'
import {
    BillingAccountProfileResponse,
    BillingAccountsViewData,
    downloadBlobFile,
    downloadReportAsCsv,
    downloadReportAsJson,
    fetchReportJson,
    fetchReportsIndex,
    ReportDefinition,
    ReportGroup,
    ReportParameter,
    ReportsIndexResponse,
    SfdcBillingAccountPaymentRow,
} from '../../lib/services'

import { getReportParameterValidationError } from './reports-page.validation'
import styles from './ReportsPage.module.scss'

const pageTitle = 'Reports'
const bulkMembersByHandlesPath = '/identity/users-by-handles'
const BILLING_ACCOUNTS_REPORT_PATH = '/sfdc/billing-accounts'
const SFDC_PAYMENTS_REPORT_PATH = '/sfdc/payments'
const BILLING_ACCOUNTS_REPORT_DEFINITION: ReportDefinition = {
    description: 'View billing-account details and SFDC payments by billing account ID.',
    method: 'GET',
    name: 'Billing Accounts',
    parameters: [
        {
            description: 'Billing account ID',
            location: 'query',
            name: 'billingAccountId',
            required: true,
            type: 'string',
        },
        {
            description: 'Optional start date for payment filtering (ISO 8601)',
            location: 'query',
            name: 'startDate',
            type: 'date',
        },
        {
            description: 'Optional end date for payment filtering (ISO 8601)',
            location: 'query',
            name: 'endDate',
            type: 'date',
        },
    ],
    path: BILLING_ACCOUNTS_REPORT_PATH,
}

type ReportsPageTab = 'reports' | 'billingAccounts'

const buildSfdcPaymentsQueryPath = (
    billingAccountId: string,
    startDate?: string,
    endDate?: string,
): string => {
    const query = new URLSearchParams()
    query.append('billingAccountIds', billingAccountId.trim())
    const start = startDate?.trim()
    const end = endDate?.trim()

    if (start) {
        query.append('startDate', start)
    }

    if (end) {
        query.append('endDate', end)
    }

    return `${SFDC_PAYMENTS_REPORT_PATH}?${query.toString()}`
}

const formatReportCell = (value: unknown): string => {
    if (value === null || value === undefined || value === '') {
        return '—'
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No'
    }

    return String(value)
}

const formatPaymentDate = (iso: string): string => {
    const parsed = Date.parse(iso)

    if (Number.isNaN(parsed)) {
        return iso
    }

    return new Date(parsed)
        .toLocaleString()
}

const PAYMENT_TABLE_COLUMNS: { key: keyof SfdcBillingAccountPaymentRow; label: string }[] = [
    { key: 'paymentId', label: 'Payment ID' },
    { key: 'paymentDate', label: 'Payment date' },
    { key: 'billingAccountId', label: 'Billing account ID' },
    { key: 'paymentStatus', label: 'Status' },
    { key: 'challengeFee', label: 'Challenge fee' },
    { key: 'paymentAmount', label: 'Payment amount' },
    { key: 'challengeId', label: 'Challenge ID' },
    { key: 'category', label: 'Category' },
    { key: 'isTask', label: 'Task' },
    { key: 'challengeName', label: 'Challenge name' },
    { key: 'challengeStatus', label: 'Challenge status' },
    { key: 'winnerHandle', label: 'Winner handle' },
    { key: 'winnerId', label: 'Winner ID' },
    { key: 'winnerFirstName', label: 'Winner first name' },
    { key: 'winnerLastName', label: 'Winner last name' },
]
const PAYMENT_ROWS_PER_PAGE_OPTIONS = [10, 25, 50]

const BillingAccountReportResults = (
    props: { data: BillingAccountsViewData },
): JSX.Element => {
    const billingAccount: BillingAccountsViewData['billingAccount'] = props.data.billingAccount
    const payments: BillingAccountsViewData['payments'] = props.data.payments
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [rowsPerPage, setRowsPerPage] = useState<number>(PAYMENT_ROWS_PER_PAGE_OPTIONS[0])
    const total = payments.length
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage))
    const currentSliceStart = (currentPage - 1) * rowsPerPage
    const paginatedPayments = payments.slice(currentSliceStart, currentSliceStart + rowsPerPage)
    const showingStart = total === 0 ? 0 : ((currentPage - 1) * rowsPerPage) + 1
    const showingEnd = Math.min(currentPage * rowsPerPage, total)

    useEffect(() => {
        setCurrentPage(1)
    }, [payments])

    function handleRowsPerPageChange(event: ChangeEvent<HTMLSelectElement>): void {
        setRowsPerPage(Number(event.target.value))
        setCurrentPage(1)
    }

    return (
        <div>
            <div className={styles.billingSummary}>
                <div className={styles.billingSummaryTitle}>Billing account</div>
                {billingAccount ? (
                    <div className={styles.billingDetailGrid}>
                        <div className={styles.billingDetailItem}>
                            <span className={styles.billingDetailLabel}>Name</span>
                            <span className={styles.billingDetailValue}>{billingAccount.name}</span>
                        </div>
                        <div className={styles.billingDetailItem}>
                            <span className={styles.billingDetailLabel}>Description</span>
                            <span className={styles.billingDetailValue}>
                                {formatReportCell(billingAccount.description)}
                            </span>
                        </div>
                        <div className={styles.billingDetailItem}>
                            <span className={styles.billingDetailLabel}>Subcontracting end customer</span>
                            <span className={styles.billingDetailValue}>
                                {formatReportCell(billingAccount.subcontractingEndCustomer)}
                            </span>
                        </div>
                        <div className={styles.billingDetailItem}>
                            <span className={styles.billingDetailLabel}>Status</span>
                            <span className={styles.billingDetailValue}>{billingAccount.status}</span>
                        </div>
                        <div className={styles.billingDetailItem}>
                            <span className={styles.billingDetailLabel}>Start date</span>
                            <span className={styles.billingDetailValue}>
                                {billingAccount.startDate
                                    ? formatPaymentDate(String(billingAccount.startDate))
                                    : '—'}
                            </span>
                        </div>
                        <div className={styles.billingDetailItem}>
                            <span className={styles.billingDetailLabel}>End date</span>
                            <span className={styles.billingDetailValue}>
                                {billingAccount.endDate
                                    ? formatPaymentDate(String(billingAccount.endDate))
                                    : '—'}
                            </span>
                        </div>
                        <div className={styles.billingDetailItem}>
                            <span className={styles.billingDetailLabel}>Budget</span>
                            <span className={styles.billingDetailValue}>
                                {formatReportCell(billingAccount.budget)}
                            </span>
                        </div>
                        <div className={styles.billingDetailItem}>
                            <span className={styles.billingDetailLabel}>Markup</span>
                            <span className={styles.billingDetailValue}>
                                {formatReportCell(billingAccount.markup)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className={styles.billingMissingNotice}>
                        No billing account profile was found for this ID. Payments for this account may still
                        appear below.
                    </div>
                )}
            </div>

            <div className={styles.paymentsSection}>
                <div className={styles.paymentsSectionTitle}>Payments</div>
                {total === 0 ? (
                    <div className={styles.paymentsEmpty}>No payments matched the selected filters.</div>
                ) : (
                    <div className={styles.paymentsResults}>
                        <div className={styles.tableWrap}>
                            <table className={styles.paymentsTable}>
                                <thead>
                                    <tr>
                                        {PAYMENT_TABLE_COLUMNS.map(col => (
                                            <th key={col.key}>{col.label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedPayments.map(row => (
                                        <tr key={row.paymentId}>
                                            {PAYMENT_TABLE_COLUMNS.map(col => (
                                                <td key={col.key}>
                                                    {col.key === 'paymentDate'
                                                        ? formatPaymentDate(String(row[col.key]))
                                                        : formatReportCell(row[col.key])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className={styles.paymentsPagination}>
                            <div className={styles.perPageControl}>
                                <label htmlFor='billing-payments-per-page'>Rows per page</label>
                                <select
                                    id='billing-payments-per-page'
                                    value={rowsPerPage}
                                    onChange={handleRowsPerPageChange}
                                >
                                    {PAYMENT_ROWS_PER_PAGE_OPTIONS.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.paginationMeta}>
                                {`Showing ${showingStart}-${showingEnd} of ${total} payments`}
                            </div>
                            <Pagination
                                page={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const buildDownloadName = (
    name: string,
    extension: 'json' | 'csv',
    suffix?: string,
): string => {
    const normalized = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    const normalizedSuffix = suffix
        ? suffix
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/(^-|-$)+/g, '')
        : ''

    const base = normalized || 'report'
    return normalizedSuffix
        ? `${base}_${normalizedSuffix}.${extension}`
        : `${base}.${extension}`
}

const formatMethod = (method?: string): string => (
    method ? method.toUpperCase() : 'GET'
)

const formatParameterLabel = (name: string): string => (
    name
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/Ids\b/g, 'IDs')
        .replace(/^./, char => char.toUpperCase())
)

const buildParameterTooltipContent = (parameter: ReportParameter): JSX.Element => (
    <>
        <div>{parameter.description?.trim() || 'No description available.'}</div>
        <div>
            {`Location: ${parameter.location || 'query'} (${parameter.name})`}
        </div>
    </>
)

const EMPTY_BILLING_ACCOUNT_PROFILE_RESPONSE: BillingAccountProfileResponse = {
    billingAccount: undefined,
}

type ReportActionsProps = {
    handleCsvDownload: () => void
    handleJsonDownload: () => void
    handleResetFilters: () => void
    handleOpenBulkMemberLookup: () => void
    isDownloadDisabled: boolean
    isHandleLookupPostReport: boolean
    isResetDisabled: boolean
    isPostReport: boolean
}

const ReportActions = (props: ReportActionsProps): JSX.Element => {
    if (props.isPostReport) {
        return (
            <div className={styles.postReportNotice}>
                <div>
                    This report uses a POST request body and cannot be downloaded from this
                    page.
                </div>
                {props.isHandleLookupPostReport ? (
                    <Button primary onClick={props.handleOpenBulkMemberLookup}>
                        Open Bulk Member Lookup
                    </Button>
                ) : (
                    <div className={styles.postReportHint}>
                        Run this report from its dedicated workflow.
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={styles.actions}>
            <Button
                primary
                disabled={props.isDownloadDisabled}
                onClick={props.handleJsonDownload}
            >
                Download as JSON
            </Button>
            <Button
                secondary
                disabled={props.isDownloadDisabled}
                onClick={props.handleCsvDownload}
            >
                Download as CSV
            </Button>
            <Button
                secondary
                disabled={props.isResetDisabled}
                onClick={props.handleResetFilters}
            >
                Reset Filters
            </Button>
        </div>
    )
}

type SelectedReportSectionProps = {
    renderParameterInput: (parameter: ReportParameter) => JSX.Element
    reportActions: JSX.Element
    selectedReport?: ReportDefinition
}

const SelectedReportSection = (props: SelectedReportSectionProps): JSX.Element => {
    if (!props.selectedReport) {
        return <></>
    }

    return (
        <>
            <div className={styles.reportDetails}>
                <div className={styles.reportTitle}>{props.selectedReport.name}</div>
                {props.selectedReport.description && (
                    <div className={styles.reportDescription}>
                        {props.selectedReport.description}
                    </div>
                )}
                <div className={styles.reportMeta}>
                    {formatMethod(props.selectedReport.method)}
                    {' '}
                    {props.selectedReport.path}
                </div>
            </div>

            {(props.selectedReport.parameters?.length ?? 0) > 0 ? (
                <div className={styles.filtersPanel}>
                    <div className={styles.params}>
                        {props.selectedReport.parameters?.map(parameter => (
                            <div key={parameter.name} className={styles.paramCard}>
                                <div className={styles.paramHeader}>
                                    <div className={styles.paramTitleRow}>
                                        <div className={styles.paramLabel}>
                                            {formatParameterLabel(parameter.name)}
                                            {parameter.required ? ' *' : ''}
                                        </div>
                                        <div className={styles.paramHeaderActions}>
                                            <div className={styles.paramTypePill}>{parameter.type}</div>
                                            <Tooltip
                                                content={buildParameterTooltipContent(parameter)}
                                                place='top'
                                            >
                                                <button
                                                    type='button'
                                                    className={styles.paramInfoButton}
                                                    aria-label={`Metadata for ${parameter.name}`}
                                                >
                                                    <IconOutline.InformationCircleIcon />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                                {props.renderParameterInput(parameter)}
                            </div>
                        ))}
                    </div>
                    <div className={styles.actionsBar}>
                        {props.reportActions}
                    </div>
                </div>
            ) : (
                props.reportActions
            )}
        </>
    )
}

type ReportsPageContentProps = {
    initialTab: ReportsPageTab
}

// eslint-disable-next-line complexity
const ReportsPageContent: FC<ReportsPageContentProps> = props => {
    const navigate: NavigateFunction = useNavigate()
    const [activeTab] = useState<ReportsPageTab>(props.initialTab)
    const [reportsIndex, setReportsIndex] = useState<ReportsIndexResponse>({})
    const [selectedBasePath, setSelectedBasePath] = useState<string>('')
    const [selectedReportPath, setSelectedReportPath] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [downloadingFormat, setDownloadingFormat] = useState<'json' | 'csv' | undefined>(undefined)
    const [parameterValues, setParameterValues] = useState<Record<string, string>>({})
    const [billingAccountViewData, setBillingAccountViewData] = useState<
        BillingAccountsViewData | undefined
    >(undefined)
    const [isBillingAccountViewLoading, setIsBillingAccountViewLoading] = useState<boolean>(false)
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

    const selectedReportForForm = activeTab === 'billingAccounts'
        ? BILLING_ACCOUNTS_REPORT_DEFINITION
        : selectedReport

    const handleBasePathChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setSelectedBasePath(event.target.value)
        setSelectedReportPath('')
        setParameterValues({})
        setBillingAccountViewData(undefined)
    }, [])

    const handleReportChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setSelectedReportPath(event.target.value)
        setParameterValues({})
        setBillingAccountViewData(undefined)
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

    const parameterErrors = useMemo<Record<string, string>>(() => (
        (selectedReportForForm?.parameters ?? []).reduce<Record<string, string>>((errors, parameter) => {
            const error = getReportParameterValidationError(parameter, parameterValues[parameter.name])

            if (error) {
                errors[parameter.name] = error
            }

            return errors
        }, {})
    ), [parameterValues, selectedReportForForm])

    const hasInvalidParameterValues = useMemo(() => (
        Object.keys(parameterErrors).length > 0
    ), [parameterErrors])

    const handleBillingAccountView = useCallback(async () => {
        if (activeTab !== 'billingAccounts' || hasInvalidParameterValues) {
            return
        }

        const billingAccountId = parameterValues.billingAccountId?.trim()

        if (!billingAccountId) {
            return
        }

        try {
            setIsBillingAccountViewLoading(true)
            const profileQuery = new URLSearchParams({ billingAccountId })
            const profilePath = `${BILLING_ACCOUNTS_REPORT_PATH}?${profileQuery.toString()}`
            const paymentsPath = buildSfdcPaymentsQueryPath(
                billingAccountId,
                parameterValues.startDate,
                parameterValues.endDate,
            )

            const paymentsPromise = fetchReportJson<SfdcBillingAccountPaymentRow[]>(paymentsPath)
            const profilePromise = fetchReportJson<BillingAccountProfileResponse>(profilePath)
                .catch(() => EMPTY_BILLING_ACCOUNT_PROFILE_RESPONSE)
            const [profile, payments] = await Promise.all([profilePromise, paymentsPromise])

            setBillingAccountViewData({
                billingAccount: profile.billingAccount,
                payments,
            })
        } catch (error) {
            handleError(error)
        } finally {
            setIsBillingAccountViewLoading(false)
        }
    }, [
        activeTab,
        hasInvalidParameterValues,
        parameterValues.billingAccountId,
        parameterValues.endDate,
        parameterValues.startDate,
    ])

    const handleDownload = useCallback(async (format: 'json' | 'csv') => {
        if (!selectedReport || hasInvalidParameterValues) {
            return
        }

        try {
            setDownloadingFormat(format)

            const requestPath = buildReportPathWithParams(selectedReport)

            const blob = format === 'json'
                ? await downloadReportAsJson(requestPath)
                : await downloadReportAsCsv(requestPath)

            const challengeIdSuffix = parameterValues.challengeId?.trim()
            const fileName = buildDownloadName(
                selectedReport.name,
                format,
                challengeIdSuffix,
            )
            downloadBlobFile(blob, fileName)
        } catch (error) {
            handleError(error)
        } finally {
            setDownloadingFormat(undefined)
        }
    }, [buildReportPathWithParams, hasInvalidParameterValues, parameterValues.challengeId, selectedReport])

    const handleOpenBulkMemberLookup = useCallback(() => {
        navigate(bulkMemberLookupRouteId)
    }, [navigate])

    const handleResetFilters = useCallback(() => {
        setParameterValues({})
        setBillingAccountViewData(undefined)
    }, [])

    const handleBillingAccountViewClick = useCallback(() => {
        handleBillingAccountView()
            .catch(handleError)
    }, [handleBillingAccountView])

    const isDownloading = downloadingFormat !== undefined
    const isBusy = isDownloading || isBillingAccountViewLoading

    const requiredParamsMissing = useMemo(() => {
        const params = selectedReportForForm?.parameters ?? []
        return params.some(param => param.required && !(parameterValues[param.name]?.trim()))
    }, [parameterValues, selectedReportForForm])

    const hasUnresolvedPathParams = useMemo(() => (
        (selectedReportForForm?.parameters ?? [])
            .filter(param => param.location === 'path')
            .some(param => !parameterValues[param.name]?.trim())
    ), [parameterValues, selectedReportForForm])

    const isPostReport = selectedReport?.method?.toUpperCase() === 'POST'
    const isHandleLookupPostReport = isPostReport && selectedReport.path === bulkMembersByHandlesPath
    const isDownloadDisabled = !selectedReport
        || isPostReport
        || isDownloading
        || requiredParamsMissing
        || hasInvalidParameterValues
        || hasUnresolvedPathParams

    const billingAccountViewDisabled = !selectedReportForForm
        || isDownloading
        || isBillingAccountViewLoading
        || requiredParamsMissing
        || hasInvalidParameterValues
        || hasUnresolvedPathParams
    const isResetDisabled = Object.keys(parameterValues).length === 0

    const handleJsonDownload = useCallback(() => {
        handleDownload('json')
    }, [handleDownload])

    const handleCsvDownload = useCallback(() => {
        handleDownload('csv')
    }, [handleDownload])

    const billingAccountReportActions = (
        <div className={styles.actions}>
            <Button
                primary
                disabled={billingAccountViewDisabled}
                onClick={handleBillingAccountViewClick}
            >
                View
            </Button>
            <Button
                secondary
                disabled={isResetDisabled}
                onClick={handleResetFilters}
            >
                Reset Filters
            </Button>
        </div>
    )

    const reportActions = (
        <ReportActions
            handleCsvDownload={handleCsvDownload}
            handleJsonDownload={handleJsonDownload}
            handleResetFilters={handleResetFilters}
            handleOpenBulkMemberLookup={handleOpenBulkMemberLookup}
            isDownloadDisabled={isDownloadDisabled}
            isHandleLookupPostReport={isHandleLookupPostReport}
            isResetDisabled={isResetDisabled}
            isPostReport={isPostReport}
        />
    )

    const renderParameterInput = useCallback((parameter: ReportParameter) => {
        const commonProps = {
            label: formatParameterLabel(parameter.name),
            name: parameter.name,
            placeholder: parameter.type === 'date'
                ? 'YYYY-MM-DD'
                : (parameter.type.endsWith('[]') ? 'Comma-separated values' : 'Enter value'),
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
                forceUpdateValue
                value={parameterValues[parameter.name] ?? ''}
                onChange={handleParameterChange}
                error={parameterErrors[parameter.name]}
                dirty={!!parameterErrors[parameter.name]}
                type={parameter.type === 'number' ? 'number' : 'text'}
                hint={parameter.type === 'date' ? 'Use ISO 8601 format (e.g. 2024-01-31)' : undefined}
            />
        )
    }, [createSelectParamChange, handleParameterChange, parameterErrors, parameterValues])

    return (
        <>
            {isBusy && (
                <LoadingSpinner
                    overlay
                    message={isDownloading ? 'Generating Report…' : 'Loading billing account data…'}
                />
            )}
            <div className={styles.page}>
                <PageTitle>{pageTitle}</PageTitle>
                <p className={styles.instructions}>
                    {activeTab === 'reports'
                        ? 'Select a base path to view available reports. Choose a report, '
                            + 'fill required parameters, and download JSON or CSV from the reports API.'
                        : 'Enter a billing account ID and optional start/end dates, then click View '
                            + 'to load billing account payment data.'}
                </p>

                {isLoading ? (
                    <div className={styles.spinnerWrapper}>
                        <LoadingSpinner />
                    </div>
                ) : (
                    <>
                        {activeTab === 'reports' ? (
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

                                <SelectedReportSection
                                    renderParameterInput={renderParameterInput}
                                    reportActions={reportActions}
                                    selectedReport={selectedReport}
                                />
                            </>
                        ) : (
                            <SelectedReportSection
                                renderParameterInput={renderParameterInput}
                                reportActions={billingAccountReportActions}
                                selectedReport={BILLING_ACCOUNTS_REPORT_DEFINITION}
                            />
                        )}

                        {activeTab === 'billingAccounts' && billingAccountViewData ? (
                            <BillingAccountReportResults data={billingAccountViewData} />
                        ) : undefined}
                    </>
                )}
            </div>
        </>
    )
}

export const ReportsPage: FC = () => (
    <ReportsPageContent initialTab='reports' />
)

export const BillingAccountsPage: FC = () => (
    <ReportsPageContent initialTab='billingAccounts' />
)

export default ReportsPage
