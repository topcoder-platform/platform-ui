import { Link } from '@reach/router'
import _ from 'lodash'
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'

import { LoadingSpinner } from '../../../../lib'
import { workFactoryMapFormData } from '../../work-lib'

import styles from './WorkDetailDetailsPane.module.scss'

interface WorkDetailDetailsPaneProps {
    formData: any,
    isReviewPage?: boolean,
    redirectUrl?: string
}

interface FormDetail {
    key: string,
    title: string,
    value: any
}

const WorkDetailDetailsPane: FC<WorkDetailDetailsPaneProps> = ({ formData, isReviewPage = false, redirectUrl = '' }: WorkDetailDetailsPaneProps) => {
    const [details, setDetails]: [ReadonlyArray<FormDetail>, Dispatch<SetStateAction<ReadonlyArray<FormDetail>>>] = useState<ReadonlyArray<FormDetail>>([])

    useEffect(() => {
        if (!!formData?.basicInfo) {
            setDetails(workFactoryMapFormData(formData?.workType?.selectedWorkType, formData.basicInfo))
        }
    }, [formData])

    if (!details.length) {
        return <LoadingSpinner />
    }

    return (
        <>
            {isReviewPage && (
                <div className={styles['header']}>
                    <h3 className={styles['title']}>REVIEW REQUIREMENTS</h3>
                    <Link className={styles['link']} to={redirectUrl}>
                        edit
                    </Link>
                </div>
            )}
            {details.map((detail) => {
                return (
                    <div key={detail.key} className={styles['detail']}>
                        <h4 className={styles['title']}>{detail.title}</h4>
                        <p className={styles['content']}>{formatOption(detail.value)}</p>
                    </div>
                )
            })}
        </>
    )
}

function formatOption(detail: Array<string> | {} | string): string | Array<JSX.Element> | JSX.Element {
    const noInfoProvidedElement: JSX.Element = <span className={styles['no-info']}>Not provided</span>
    const isEmpty: boolean = checkIsEmpty(detail)
    if (isEmpty) {
        return noInfoProvidedElement
    }
    if (_.isArray(detail)) {
        return detail
            .map((val, index) => (<div key={`${index}`}>{val}</div>))
    }
    if (_.isObject(detail)) {
        return Object.keys(detail)
            .map((key) => {
                const value: any = detail[key as keyof typeof detail] || noInfoProvidedElement
                return <div key={`${key}`}>{`${key}: `}{value}</div>
            })
    }
    return detail
}

function checkIsEmpty(detail: Array<string> | {} | string): boolean {
    return !detail ||
        (typeof detail === 'string' && detail.trim().length === 0) ||
        (_.isArray(detail) && detail.length === 0) ||
        (_.isObject(detail) && Object.values(detail)
            .filter((val) => val?.trim().length > 0).length === 0)
}

export default WorkDetailDetailsPane
