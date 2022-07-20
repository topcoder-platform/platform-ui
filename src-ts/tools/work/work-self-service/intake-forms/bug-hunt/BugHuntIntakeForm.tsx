import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import {
    Form,
    FormDefinition,
    formGetInputModel,
    FormInputModel,
    IconOutline,
    InfoCard,
    PageDivider,
    useCheckIsMobile
} from '../../../../../lib'
import {
    Challenge,
    ChallengeMetadataName,
    workBugHuntConfig,
    workCreateAsync,
    WorkType,
    workUpdateAsync
} from '../../../work-lib'
import { getAsyncByWorkId } from '../../../work-lib/work-provider/work-functions/work-store/work.store'
import { WorkServicePrice } from '../../../work-service-price'
import { WorkTypeBanner } from '../../../work-type-banner'

import { BugHuntFormConfig } from './bug-hunt.form.config'
import styles from './BugHunt.module.scss'
import { DeliverablesInfoCard } from './deliverables-info-card'


const BugHuntIntakeForm: React.FC = () => {
    const workId: string | undefined = useParams().workId
    const isMobile: boolean = useCheckIsMobile()

    const [challenge, setChallenge]: [Challenge | undefined, Dispatch<SetStateAction<Challenge | undefined>>] = useState()
    const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...BugHuntFormConfig })

    const defaultValues: object = {
        currentStep: 'basicInfo',
        packageType: 'standard',
    }

    useEffect(() => {
        const useEffectAsync: () => Promise<void> = async () => {
            if (!workId) {
                // create challenge
                const response: any = await workCreateAsync(WorkType.bugHunt)
                setChallenge(response)
            } else {
                // fetch challenge using workId
                const response: any = await getAsyncByWorkId(workId)
                console.log('fetched Challenge', response)
                // Maybe?
                // defaultValues = response.values
                // TODO: after fetch, if currentStep !== 'basicInfo'
                    // - if !LoggedIn, direct to LoginPrompt
                    // - else direct to routes[bughunt].currentStep
            }
        }

        useEffectAsync()
    }, [workId])

    const requestGenerator: (inputs: ReadonlyArray<FormInputModel>) => void = (inputs) => {
        const projectTitle: string = formGetInputModel(inputs, ChallengeMetadataName.projectTitle).value as string
        const featuresToTest: string = formGetInputModel(inputs, ChallengeMetadataName.featuresToTest).value as string
        const deliveryType: string = formGetInputModel(inputs, ChallengeMetadataName.deliveryType).value as string
        const repositoryLink: string = formGetInputModel(inputs, ChallengeMetadataName.repositoryLink).value as string
        const websiteURL: string = formGetInputModel(inputs, ChallengeMetadataName.websiteURL).value as string
        const goals: string = formGetInputModel(inputs, ChallengeMetadataName.goals).value as string
        const packageType: string = formGetInputModel(inputs, ChallengeMetadataName.packageType).value as string
        return {
            deliveryType,
            featuresToTest,
            goals,
            packageType,
            projectTitle,
            repositoryLink,
            websiteURL,
        }
    }

    const onSave: (val: any) => Promise<void> = (val: any) => {
        if (!challenge) { return Promise.resolve() }

        return workUpdateAsync(WorkType.bugHunt, challenge, val)
            .then(() => {
                // TODO: Navigate to a different page (review, back to dashboard, etc)
            })
    }

    return (
        <>
            <WorkTypeBanner
                title={workBugHuntConfig.title}
                subTitle={workBugHuntConfig.subtitle}
                workType={workBugHuntConfig.type}
            />
            <WorkServicePrice
                duration={workBugHuntConfig.duration}
                hideTitle
                icon={<IconOutline.BadgeCheckIcon width={48} height={48} />}
                price={1599} // TODO in PROD-2446 - Budget/Pricing. Matching Figma mockup until then.
                serviceType={workBugHuntConfig.type}
                showIcon
            />
            <div className={styles['bug-hunt-wrapper']}>
                <DeliverablesInfoCard isMobile={isMobile} />
                <InfoCard
                    color='success'
                    defaultOpen={!isMobile}
                    isCollapsible
                    title={`About ${workBugHuntConfig.type}`}
                >
                    {workBugHuntConfig.about}
                </InfoCard>
                <PageDivider />
                <Form formDef={formDef} formValues={defaultValues} requestGenerator={requestGenerator} save={onSave} />
            </div>
        </>
    )
}

export default BugHuntIntakeForm
