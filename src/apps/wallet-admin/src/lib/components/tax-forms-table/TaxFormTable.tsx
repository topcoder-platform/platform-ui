/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React from 'react'

import { Button, IconOutline, Tooltip } from '~/libs/ui'

import { TaxForm } from '../../models/TaxForm'

import styles from './TaxFormTable.module.scss'

interface TaxFormTableProps {
    taxForms: ReadonlyArray<TaxForm>;
    currentPage: number;
    numPages: number;
    onNextPageClick: () => void;
    onPreviousPageClick: () => void;
    onPageClick: (pageNumber: number) => void;
    onDownloadClick?: (form: TaxForm) => void;
    onDeleteClick?: (form: TaxForm) => void;
}

const TaxFormTable: React.FC<TaxFormTableProps> = (props: TaxFormTableProps) => (
    <>
        <div className={styles.tableContainer}>
            <table>
                <thead>
                    <tr>
                        <th className='body-ultra-small-bold'>HANDLE</th>
                        <th className='body-ultra-small-bold'>FORM</th>
                        <th className='body-ultra-small-bold'>DATE FILED</th>
                        <th className='body-ultra-small-bold'>STATUS</th>
                        {/* eslint-disable-next-line jsx-a11y/control-has-associated-label */}
                        <th className='body-ultra-small'> </th>
                    </tr>
                </thead>
                <tbody>
                    {props.taxForms.map(form => (
                        <tr key={form.id}>
                            <td className='body-small-bold'>{form.handle}</td>
                            <td className={`body-small-bold ${styles.capitalize}`}>{form.taxForm.name}</td>
                            <td className='body-small-bold'>{form.dateFiled}</td>
                            <td>{form.status}</td>
                            <td className={styles.actionButtons}>
                                <Tooltip
                                    content='Download Form'
                                    place='top'
                                >
                                    <Button
                                        icon={IconOutline.DocumentDownloadIcon}
                                        size='sm'
                                        onClick={() => props.onDownloadClick !== undefined && props.onDownloadClick(form)}
                                    />
                                </Tooltip>
                                <Tooltip
                                    content='Remove Submission'
                                    place='top'
                                >
                                    <Button
                                        icon={IconOutline.TrashIcon}
                                        size='sm'
                                        onClick={() => props.onDeleteClick !== undefined && props.onDeleteClick(form)}
                                    />
                                </Tooltip>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {props.numPages > 1 && (
            <div className={styles.footer}>
                <div className={styles.pageButtons}>
                    <Button
                        onClick={props.onPreviousPageClick}
                        secondary
                        size='md'
                        icon={IconOutline.ChevronLeftIcon}
                        iconToLeft
                        label='PREVIOUS'
                        disabled={props.currentPage === 1}
                    />
                    {props.currentPage > 3 && <span>...</span>}
                    <div className={styles.pageNumbers}>
                        {Array.from(Array(props.numPages)
                            .keys())
                            .filter(pageNumber => {
                                const currentPage = props.currentPage - 1
                                const maxPagesToShow = 5
                                const halfMaxPagesToShow = Math.floor(maxPagesToShow / 2)
                                const startPage = Math.max(currentPage - halfMaxPagesToShow, 0)
                                const endPage = Math.min(startPage + maxPagesToShow - 1, props.numPages - 1)

                                return pageNumber >= startPage && pageNumber <= endPage
                            })
                            .map(pageNumber => (
                                <Button
                                    key={`page-${pageNumber}`}
                                    secondary
                                    variant='round'
                                    label={`${pageNumber + 1}`}
                                    onClick={() => props.onPageClick(pageNumber + 1)}
                                    disabled={pageNumber === props.currentPage - 1}
                                />
                            ))}
                    </div>
                    {props.currentPage < props.numPages - 2 && <span>...</span>}
                    <Button
                        onClick={props.onNextPageClick}
                        secondary
                        size='md'
                        icon={IconOutline.ChevronRightIcon}
                        iconToRight
                        label='NEXT'
                        disabled={props.currentPage === props.numPages}
                    />
                </div>
            </div>
        )}
    </>
)

export default TaxFormTable
