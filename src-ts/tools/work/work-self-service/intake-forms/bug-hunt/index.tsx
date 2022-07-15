import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { Form, IconOutline } from '../../../../../lib'
import { Challenge, workCreateAsync, WorkType } from '../../../work-lib'
import { bugHuntConfig } from '../../../work-lib/work-provider/work-functions/work-store/work-type.config'
import { WorkServicePrice } from '../../../work-service-price'
import { WorkTypeBanner } from '../../../work-type-banner'

import { BugHuntFormConfig } from './bug-hunt.form.config'
import styles from './BugHunt.module.scss'

interface BugHuntIntakeFormProps {
    workId?: string
}

const BugHuntIntakeForm: React.FC<BugHuntIntakeFormProps> = ({ workId }) => {

    const [challenge, setChallenge]: [Challenge | undefined, Dispatch<SetStateAction<Challenge | undefined>>] = useState()

    useEffect(() => {
        const useEffectAsync: () => Promise<void> = async () => {
            if (!workId) {
                // create challenge
                const response: any = await workCreateAsync(WorkType.bugHunt)
                setChallenge(response)
            } else {
                // TODO: fetch challenge using workId
            }
        }

        useEffectAsync()
    }, [workId])

    const requestGenerator: () => void = () => { }

    const onSave: (val: any) => Promise<void> = (val: any) => new Promise(() => { }).then(() => { })

    return (
        <>
            <WorkTypeBanner
                title={bugHuntConfig.title}
                subTitle={bugHuntConfig.subtitle}
                workType={bugHuntConfig.type}
            />
            <WorkServicePrice
                duration={bugHuntConfig.duration}
                hideTitle
                icon={<IconOutline.BadgeCheckIcon width={48} height={48} />}
                price={1599} // TODO in PROD-2446 - Budget/Pricing. Matching Figma mockup until then.
                serviceType={bugHuntConfig.type}
                showIcon
            />
            <div className={styles['bug-hunt-wrapper']}>
                <Form formDef={BugHuntFormConfig} requestGenerator={requestGenerator} save={onSave} />
            </div>
        </>

    )
}

export default BugHuntIntakeForm
