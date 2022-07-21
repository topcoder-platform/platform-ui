import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

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
    PricePackageName,
    workBugHuntConfig,
    workCreateAsync,
    WorkType,
    workUpdateAsync
} from '../../../work-lib'
import { WorkServicePrice } from '../../../work-service-price'
import { WorkTypeBanner } from '../../../work-type-banner'
import { dashboardRoute } from '../../../work.routes'
import IntakeFormsBreadcrumb from '../intake-forms-breadcrumb/IntakeFormsBreadcrumb'

import { BugHuntFormConfig } from './bug-hunt.form.config'
import styles from './BugHunt.module.scss'
import { DeliverablesInfoCard } from './deliverables-info-card'

interface BugHuntIntakeFormProps {
    workId?: string
}

interface DefaultValues {
    [ChallengeMetadataName.packageType]: PricePackageName
}

const BugHuntIntakeForm: React.FC<BugHuntIntakeFormProps> = ({ workId }) => {

    const navigate: NavigateFunction = useNavigate()

    const isMobile: boolean = useCheckIsMobile()

    let action: string = ''
    BugHuntFormConfig.buttons.primaryGroup[0].onClick = () => { action = 'save' }
    BugHuntFormConfig.buttons.primaryGroup[1].onClick = () => { action = 'submit' }

    const [challenge, setChallenge]: [Challenge | undefined, Dispatch<SetStateAction<Challenge | undefined>>] = useState()
    const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...BugHuntFormConfig })

    const defaultValues: DefaultValues = {
        [ChallengeMetadataName.packageType]: 'standard',
    }

    const [selectedPackage, setSelectedPackage]: [PricePackageName, Dispatch<SetStateAction<PricePackageName>>]
        = useState<PricePackageName>(defaultValues.packageType)

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

    const onChange: (inputs: ReadonlyArray<FormInputModel>) => void = (inputs) => {
        const packageType: PricePackageName = formGetInputModel(inputs, ChallengeMetadataName.packageType).value as PricePackageName

        if (packageType !== selectedPackage) {
            setSelectedPackage(packageType)
        }
    }

    const onSave: (val: any) => Promise<void> = (val: any) => {
        if (!challenge) { return Promise.resolve() }

        return workUpdateAsync(WorkType.bugHunt, challenge, val)
    }

    const onSaveSuccess: () => void = () => {
        if (action === 'save') {
            navigate(`${dashboardRoute}/draft`)
        } else if (action === 'submit') {
            // TODO navigate to review & payment page
        }
    }

    return (
        <>
            <IntakeFormsBreadcrumb
                basicInfoRoute={workBugHuntConfig.intakeFormRoutes[1]}
                workType={workBugHuntConfig.type}
            />
            <WorkTypeBanner
                title={workBugHuntConfig.title}
                subTitle={workBugHuntConfig.subtitle}
                workType={workBugHuntConfig.type}
            />
            <WorkServicePrice
                duration={workBugHuntConfig.duration}
                hideTitle
                icon={<IconOutline.BadgeCheckIcon width={48} height={48} />}
                price={workBugHuntConfig.priceConfig.getPrice(workBugHuntConfig.priceConfig, selectedPackage)}
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
                <Form
                    onChange={onChange}
                    formDef={formDef}
                    formValues={defaultValues}
                    onSuccess={onSaveSuccess}
                    requestGenerator={requestGenerator}
                    save={onSave}
                />
            </div>
        </>
    )
}

export default BugHuntIntakeForm
