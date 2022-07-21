import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'
import { NavigateFunction, useNavigate, useParams } from 'react-router-dom'

import {
    Form,
    FormDefinition,
    formGetInputModel,
    FormInputModel,
    IconOutline,
    InfoCard,
    PageDivider,
    profileContext,
    ProfileContextData,
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
import { ChallengeMetadata, workStoreGetChallengeByWorkId } from '../../../work-lib/work-provider/work-functions/work-store'
import { WorkIntakeFormRoutes } from '../../../work-lib/work-provider/work-functions/work-store/work-intake-form-routes.config'
import { WorkServicePrice } from '../../../work-service-price'
import { WorkTypeBanner } from '../../../work-type-banner'
import { dashboardRoute } from '../../../work.routes'

import { BugHuntFormConfig } from './bug-hunt.form.config'
import styles from './BugHunt.module.scss'
import { DeliverablesInfoCard } from './deliverables-info-card'

interface DefaultValues {
    [ChallengeMetadataName.packageType]: PricePackageName
}

const BugHuntIntakeForm: React.FC = () => {
    const workId: string | undefined = useParams().workId
    const navigate: NavigateFunction = useNavigate()

    const isMobile: boolean = useCheckIsMobile()
    const { isLoggedIn }: ProfileContextData = useContext<ProfileContextData>(profileContext)
    // TODO - this isLoggedIn check is not working - shows true even on a new incognito window

    let action: string = ''
    BugHuntFormConfig.buttons.primaryGroup[0].onClick = () => { action = 'save' }
    BugHuntFormConfig.buttons.primaryGroup[1].onClick = () => { action = 'submit' }

    const [challenge, setChallenge]: [Challenge | undefined, Dispatch<SetStateAction<Challenge | undefined>>] = useState()
    const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...BugHuntFormConfig })

    function findMetadata(metadataName: ChallengeMetadataName): ChallengeMetadata | undefined {
        return challenge?.metadata?.find((item: ChallengeMetadata) => item.name === metadataName)
    }

    let defaultValues: Record<string, any> = {
        currentStep: 'basicInfo',
        [ChallengeMetadataName.packageType]: 'standard',
    }

    const [selectedPackage, setSelectedPackage]: [PricePackageName, Dispatch<SetStateAction<PricePackageName>>]
        = useState<PricePackageName>(defaultValues.packageType)

    if (challenge) {
        const intakeFormBH: ChallengeMetadata | undefined = findMetadata(ChallengeMetadataName.intakeForm)
        if (intakeFormBH) {
            const formData: Record<string, any> = JSON.parse(intakeFormBH.value)

            // TODO: Set the correct currentStep into challenge's form data when saving form and moving on to a new page
            if (formData.currentStep && formData.currentStep !== 'basicInfo') {
                if (!isLoggedIn) {
                    navigate(WorkIntakeFormRoutes[WorkType.bugHunt]['loginPrompt'])
                } else {
                    navigate(WorkIntakeFormRoutes[WorkType.bugHunt][formData.currentStep])
                }
            }

            defaultValues = formData.form.basicInfo

            if (formData.form.basicInfo.packageType !== selectedPackage) {
                setSelectedPackage(formData.form.basicInfo.packageType)
            }
        }
    }

    useEffect(() => {
        const useEffectAsync: () => Promise<void> = async () => {
            if (!workId) {
                // create challenge
                const response: any = await workCreateAsync(WorkType.bugHunt)
                setChallenge(response)
            } else {
                // fetch challenge using workId
                const response: any = await workStoreGetChallengeByWorkId(workId)
                // TODO - if we have a workID, but no challenge, we may need a loading spinner to display until the re-render after this setChallenge()
                // TODO - Question for team: do we need to secure this fetch on the front-end, or does the back-end validate that the current user has access before giving us the data?
                setChallenge(response)
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
            if (isLoggedIn) {
                navigate(WorkIntakeFormRoutes[WorkType.bugHunt]['loginPrompt'])
            } else {
                navigate(WorkIntakeFormRoutes[WorkType.bugHunt]['review'])
            }
        }
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
