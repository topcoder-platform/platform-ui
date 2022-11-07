import cn from 'classnames'
import _ from 'lodash'
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { currencyFormat } from '../../../../../src/utils'
import { ArrowIcon, FormCard, LoadingSpinner } from '../../../../lib'
import { ChallengeMetadataName, workFactoryMapFormData } from '../../work-lib'
import BugHuntPricingConfig from '../../work-self-service/intake-forms/bug-hunt/bug-hunt.form.pricing-config'

import styles from './WorkDetailDetailsPane.module.scss'

interface WorkDetailDetailsPaneProps {
    collapsible?: boolean,
    defaultOpen?: boolean,
    formData: any,
    isReviewPage?: boolean,
    redirectUrl?: string
}

interface FormDetail {
    key: string,
    title: string,
    value: any
}

const WorkDetailDetailsPane: FC<WorkDetailDetailsPaneProps> = ({ collapsible, defaultOpen = false, formData, isReviewPage = false, redirectUrl = '' }: WorkDetailDetailsPaneProps) => {
    const [details, setDetails]: [ReadonlyArray<FormDetail>, Dispatch<SetStateAction<ReadonlyArray<FormDetail>>>] = useState<ReadonlyArray<FormDetail>>([])
    const [isOpen, setOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(collapsible ? defaultOpen : true)

    useEffect(() => {
        if (!!formData?.basicInfo) {
            setDetails(workFactoryMapFormData(formData?.workType?.selectedWorkType, formData.basicInfo))
        }
    }, [formData])

    if (!details.length) {
        return <LoadingSpinner />
    }

    const onTogglePane: () => void = () => {
        if (!collapsible) {
            return
        }

        setOpen(!isOpen)
    }

    return (
        <>
            {isReviewPage && (
                <div className={styles.header} onClick={onTogglePane}>
                    <div className={styles['header-content']}>
                        <h3 className={styles.title}>REVIEW REQUIREMENTS</h3>
                        <Link className={styles.link} to={redirectUrl}>
                            edit
                        </Link>
                    </div>
                    {
                        collapsible && (
                            <div className={cn(styles['icon-wrapper'], isOpen && styles.open)}>
                                <ArrowIcon />
                            </div>
                        )
                    }
                </div>
            )}
            {isOpen && details.map((detail) => (
                <div key={detail.key} className={styles.detail}>
                    <h4 className={styles.title}>{detail.title}</h4>
                    {detail.key === ChallengeMetadataName.packageType ? (
                        <p className={styles.content}>{getSelectedPackageFormatted(detail.value)}</p>
                    ) : (
                        <p className={styles.content}>{formatOption(detail.value)}</p>
                    )}
                </div>
            ))}
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

const getSelectedPackageFormatted: (packageId: string) => string = (packageId) => {
    const currentPackage: FormCard | undefined = BugHuntPricingConfig.find((pricingConfig) => pricingConfig.id === packageId)
    if (currentPackage) {
        const deviceType: string = currentPackage.sections?.[0]?.rows?.[3]?.text || ''
        const noOfTesters: string = `${currentPackage.sections?.[0]?.rows?.[2]?.text || 0} testers`
        return `${currentPackage.title} - ${currencyFormat(currentPackage.price)} - ${deviceType} - ${noOfTesters}`
    }

    return packageId
}

export default WorkDetailDetailsPane
