import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { Form, FormDefinition, formGetInputModel, FormInputModel, IconOutline } from '../../../../../lib'
import { Challenge, workCreateAsync, WorkType, workUpdateAsync } from '../../../work-lib'
import { bugHuntConfig } from '../../../work-lib/work-provider/work-functions/work-store/work-type.config'
import { WorkServicePrice } from '../../../work-service-price'
import { WorkTypeBanner } from '../../../work-type-banner'

import { BugHuntFormConfig, FormInputNames } from './bug-hunt.form.config'
import styles from './BugHunt.module.scss'

interface BugHuntIntakeFormProps {
    workId?: string
}

const BugHuntIntakeForm: React.FC<BugHuntIntakeFormProps> = ({ workId }) => {

    const [challenge, setChallenge]: [Challenge | undefined, Dispatch<SetStateAction<Challenge | undefined>>] = useState()
    const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...BugHuntFormConfig })

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

    const requestGenerator: (inputs: ReadonlyArray<FormInputModel>) => void = (inputs) => {
        const projectTitle: string = formGetInputModel(inputs, FormInputNames.title).value as string
        const featuresToTest: string = formGetInputModel(inputs, FormInputNames.features).value as string
        const deliveryType: string = formGetInputModel(inputs, FormInputNames.deliveryType).value as string
        const repositoryLink: string = formGetInputModel(inputs, FormInputNames.repositoryLink).value as string
        const websiteURL: string = formGetInputModel(inputs, FormInputNames.websiteURL).value as string
        const goals: string = formGetInputModel(inputs, FormInputNames.goals).value as string
        return {
            deliveryType,
            featuresToTest,
            goals,
            projectTitle,
            repositoryLink,
            websiteURL,
        }
    }

    const onSave: (val: any) => Promise<void> = (val: any) => {
        if (!challenge) { return Promise.resolve() }

        return workUpdateAsync(WorkType.bugHunt, challenge, val)
            .then(() => {
                console.log('Updated successfully')
            })
    }

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
                <Form formDef={formDef} requestGenerator={requestGenerator} save={onSave} />
            </div>
        </>
    )
}

export default BugHuntIntakeForm
