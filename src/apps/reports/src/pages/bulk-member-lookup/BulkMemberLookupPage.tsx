import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react'

import {
    Button,
    InputFilePicker,
    LoadingSpinner,
    PageTitle,
    Table,
    TableColumn,
} from '~/libs/ui'

import { postReportAsCsv, postReportAsJson } from '../../lib/services'
import { handleError } from '../../lib/utils'

import styles from './BulkMemberLookupPage.module.scss'

const pageTitle = 'Bulk Member Lookup'
const bulkMembersByHandlesPath = '/identity/users-by-handles'
const emptyValue = '—'

/**
 * Represents a resolved user row returned by bulk handle lookup.
 *
 * The table uses this shape directly to show both found and unresolved handles.
 */
type BulkMemberRow = {
    userId: number | null
    handle: string
    email: string | null
    country: string | null
}

const buildDownloadName = (extension: 'json' | 'csv'): string => (
    `bulk-member-lookup.${extension}`
)

/**
 * Parses the blob response from the reports API into lookup rows.
 * @param blob JSON blob returned from `/identity/users-by-handles`.
 * @returns Parsed list of bulk lookup rows.
 * @throws Error when the payload is not valid JSON.
 */
const parseLookupResults = async (blob: Blob): Promise<BulkMemberRow[]> => {
    const payload = await blob.text()

    if (!payload) {
        return []
    }

    const parsed = JSON.parse(payload)

    if (Array.isArray(parsed)) {
        return parsed as BulkMemberRow[]
    }

    return []
}

/**
 * Parses uploaded text/CSV content into a normalized handle list.
 * @param file Uploaded `.txt` or `.csv` file.
 * @returns Ordered non-empty handles from the file.
 * @throws Error when no handles are found in the uploaded content.
 */
const parseHandlesFromFile = async (file: File): Promise<string[]> => {
    const content = (await file.text())
        .replace(/^\uFEFF/, '')

    const handles = content
        .split(/\r?\n/)
        .flatMap(line => line.split(','))
        .map(value => value.trim()
            .replace(/^"(.*)"$/, '$1')
            .trim())
        .filter(value => value.length > 0)

    if (handles.length > 1 && /^handles?$/i.test(handles[0])) {
        handles.shift()
    }

    if (!handles.length) {
        throw new Error('Uploaded file does not contain any handles.')
    }

    return handles
}

/**
 * Triggers a browser file download from a blob.
 * @param blob File content to download.
 * @param fileName Name to use for the downloaded file.
 */
const downloadBlob = (blob: Blob, fileName: string): void => {
    const link = document.createElement('a')
    const url = window.URL.createObjectURL(blob)

    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
}

/**
 * Bulk Member Lookup page for uploading handles and resolving account details.
 *
 * Users upload a `.txt` or `.csv` file of handles, submit for lookup,
 * review results in a table, and optionally download JSON/CSV output.
 */
export const BulkMemberLookupPage: FC = () => {
    const [file, setFile]: [File | undefined, Dispatch<SetStateAction<File | undefined>>]
        = useState<File | undefined>(undefined)
    const [isSubmitting, setIsSubmitting]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [results, setResults]: [BulkMemberRow[], Dispatch<SetStateAction<BulkMemberRow[]>>]
        = useState<BulkMemberRow[]>([])
    const [hasSubmitted, setHasSubmitted]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isDownloading, setIsDownloading]: [
        'json' | 'csv' | undefined,
        Dispatch<SetStateAction<'json' | 'csv' | undefined>>
    ] = useState<'json' | 'csv' | undefined>(undefined)

    const tableColumns = useMemo<TableColumn<BulkMemberRow>[]>(() => ([
        {
            label: 'User ID',
            propertyName: 'userId',
            renderer: data => <>{data.userId ?? emptyValue}</>,
            type: 'element',
        },
        {
            label: 'Handle',
            propertyName: 'handle',
            type: 'text',
        },
        {
            label: 'Email',
            propertyName: 'email',
            renderer: data => <>{data.email ?? emptyValue}</>,
            type: 'element',
        },
        {
            label: 'Country',
            propertyName: 'country',
            renderer: data => <>{data.country ?? emptyValue}</>,
            type: 'element',
        },
    ]), [])

    const handleFileChange = useCallback((fileList: FileList | undefined): void => {
        setFile(fileList?.item(0) ?? undefined)
        setHasSubmitted(false)
        setResults([])
    }, [])

    const handleLookupMembers = useCallback(async (): Promise<void> => {
        if (!file) {
            return
        }

        try {
            setIsSubmitting(true)
            const handles = await parseHandlesFromFile(file)
            const responseBlob = await postReportAsJson(bulkMembersByHandlesPath, { handles })
            const lookupResults = await parseLookupResults(responseBlob)

            setResults(lookupResults)
            setHasSubmitted(true)
        } catch (error) {
            handleError(error)
        } finally {
            setIsSubmitting(false)
        }
    }, [file])

    const handleDownload = useCallback(async (format: 'json' | 'csv'): Promise<void> => {
        if (!file) {
            return
        }

        try {
            setIsDownloading(format)
            const handles = await parseHandlesFromFile(file)

            const blob = format === 'json'
                ? await postReportAsJson(bulkMembersByHandlesPath, { handles })
                : await postReportAsCsv(bulkMembersByHandlesPath, { handles })

            downloadBlob(blob, buildDownloadName(format))
        } catch (error) {
            handleError(error)
        } finally {
            setIsDownloading(undefined)
        }
    }, [file])

    const handleJsonDownload = useCallback(() => {
        handleDownload('json')
    }, [handleDownload])

    const handleCsvDownload = useCallback(() => {
        handleDownload('csv')
    }, [handleDownload])

    const isDownloadDisabled = !file || isSubmitting || isDownloading !== undefined

    return (
        <>
            {isSubmitting && <LoadingSpinner overlay message='Looking up members…' />}
            {isDownloading && <LoadingSpinner overlay message='Generating Report…' />}

            <div className={styles.page}>
                <PageTitle>{pageTitle}</PageTitle>

                <p className={styles.instructions}>
                    Upload a TXT or CSV file that contains one member handle per line,
                    then submit to resolve user details.
                </p>

                <div className={styles.uploadSection}>
                    <InputFilePicker
                        fileConfig={{
                            acceptFileType: '.txt,.csv',
                        }}
                        name='bulk-member-lookup-file'
                        onChange={handleFileChange}
                    />

                    <div className={styles.actions}>
                        <Button
                            primary
                            disabled={!file || isSubmitting || isDownloading !== undefined}
                            onClick={handleLookupMembers}
                        >
                            Look Up Members
                        </Button>
                    </div>
                </div>

                {hasSubmitted && (
                    <>
                        <div className={styles.resultsHeader}>
                            <h2>Results</h2>
                            <div className={styles.actions}>
                                <Button
                                    primary
                                    disabled={isDownloadDisabled}
                                    onClick={handleJsonDownload}
                                >
                                    Download as JSON
                                </Button>
                                <Button
                                    secondary
                                    disabled={isDownloadDisabled}
                                    onClick={handleCsvDownload}
                                >
                                    Download as CSV
                                </Button>
                            </div>
                        </div>

                        <div className={styles.tableWrapper}>
                            {results.length ? (
                                <Table columns={tableColumns} data={results} />
                            ) : (
                                <div className={styles.emptyState}>
                                    No members were returned for the uploaded handles.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    )
}

export default BulkMemberLookupPage
