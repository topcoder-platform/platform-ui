import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'
import { NavigateFunction, useNavigate, useParams } from 'react-router-dom'

import {
    Form,
    FormAction,
    FormDefinition,
    formGetInputFields,
    formGetInputModel,
    FormGroup,
    FormInputModel,
    formOnReset,
    IconOutline,
    InfoCard,
    LoadingSpinner,
    PageDivider,
    profileContext,
    ProfileContextData,
    useCheckIsMobile
} from '../../../../../lib'
import {
    Challenge,
    ChallengeMetadata,
    ChallengeMetadataName,
    PricePackageName,
    workBugHuntConfig,
    workCreateAsync,
    workGetByWorkIdAsync,
    WorkIntakeFormRoutes,
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

const BugHuntIntakeForm: React.FC = () => {

    const workId: string | undefined = useParams().workId
    const navigate: NavigateFunction = useNavigate()

    const isMobile: boolean = useCheckIsMobile()
    const { isLoggedIn }: ProfileContextData = useContext<ProfileContextData>(profileContext)

    const [action, setAction]: [FormAction, Dispatch<SetStateAction<FormAction>>] = useState()

    BugHuntFormConfig.buttons.primaryGroup[0].onClick = () => { setAction('save') }
    BugHuntFormConfig.buttons.primaryGroup[1].onClick = () => { setAction('submit') }
    if (BugHuntFormConfig.buttons.secondaryGroup) {
        BugHuntFormConfig.buttons.secondaryGroup[0].onClick = () => { navigate(-1) }
    }

    const [challenge, setChallenge]: [Challenge | undefined, Dispatch<SetStateAction<Challenge | undefined>>] = useState()
    const [formDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...BugHuntFormConfig })

    const [formValues, setFormValues]: [any, Dispatch<any>] = useState({
        currentStep: 'basicInfo',
        [ChallengeMetadataName.packageType]: 'standard',
    })

    const [selectedPackage, setSelectedPackage]: [PricePackageName, Dispatch<SetStateAction<PricePackageName>>]
        = useState<PricePackageName>(formValues?.packageType)

    const formInputs: Array<FormInputModel> = formGetInputFields(formDef.groups as Array<FormGroup>)
    if (!workId && !challenge) {
        formOnReset(formInputs, formValues)
    }

    useEffect(() => {
        const useEffectAsync: () => Promise<void> = async () => {
            if (!workId) {
                // create challenge
                const response: any = await workCreateAsync(WorkType.bugHunt)
                setChallenge(response)
            } else {
                // fetch challenge using workId
                const response: Challenge = await workGetByWorkIdAsync(workId)
                setChallenge(response)

                const intakeFormBH: ChallengeMetadata | undefined = response.metadata?.find((item: ChallengeMetadata) => item.name === ChallengeMetadataName.intakeForm)
                if (intakeFormBH) {
                    const formData: Record<string, any> = JSON.parse(intakeFormBH.value).form.basicInfo

                    setFormValues(formData)

                    if (formData?.packageType && formData?.packageType !== selectedPackage) {
                        setSelectedPackage(formData.packageType)
                    }
                }
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
        if (action === 'save') {
            val.currentStep = 'basicInfo'
        } else if (action === 'submit') {
            val.currentStep = 'review'
        }

        return workUpdateAsync(WorkType.bugHunt, challenge, val)
    }

    const onSaveSuccess: () => void = () => {
        if (action === 'save') {
            navigate(`${dashboardRoute}/draft`)
        } else if (action === 'submit') {
            if (!isLoggedIn) {
                navigate(WorkIntakeFormRoutes[WorkType.bugHunt]['loginPrompt'])
            } else {
                const nextUrl: string = `${WorkIntakeFormRoutes[WorkType.bugHunt]['review']}/${workId || challenge?.id}`
                navigate(nextUrl)
            }
        }
    }

    const getDynamicDuration: () => number = () => {
        return workBugHuntConfig.duration ? workBugHuntConfig.duration[selectedPackage] || 0 : 0
    }

    if (!challenge && workId) {
        return <LoadingSpinner />
    }

    return (
        <>
            <IntakeFormsBreadcrumb
                basicInfoRoute={WorkIntakeFormRoutes[WorkType.bugHunt]['basicInfo']}
                workType={workBugHuntConfig.type}
            />
            <WorkTypeBanner
                title={workBugHuntConfig.title}
                subTitle={workBugHuntConfig.subtitle}
                workType={workBugHuntConfig.type}
            />
            <WorkServicePrice
                duration={getDynamicDuration()}
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
                    formValues={formValues}
                    onSuccess={onSaveSuccess}
                    requestGenerator={requestGenerator}
                    save={onSave}
                    action={action}
                />
            </div>
        </>
    )
}

export default BugHuntIntakeForm
