/* eslint-disable @typescript-eslint/no-explicit-any */
import { NavigateFunction, useNavigate, useParams } from 'react-router-dom'
import React, { Dispatch, SetStateAction, useCallback, useContext, useEffect, useState } from 'react'

import {
    Form,
    FormAction,
    FormDefinition,
    formGetInputModel,
    FormInputModel,
    IconOutline,
    InfoCard,
    LoadingSpinner,
    PageDivider,
    SaveForLaterIcon,
    useCheckIsMobile,
} from '~/libs/ui'
import { profileContext, ProfileContextData } from '~/libs/core'

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
    workUpdateAsync,
} from '../../../lib'
import { WorkServicePrice } from '../../../components/work-service-price'
import { WorkTypeBanner } from '../../../components/work-type-banner'
import { workDashboardRoute, selfServiceStartRoute } from '../../../self-service.routes'
import { IntakeFormsBreadcrumb } from '../intake-forms-breadcrumb'

import { BugHuntFormConfig } from './bug-hunt.form.config'
import { DeliverablesInfoCard } from './deliverables-info-card'
import styles from './BugHunt.module.scss'

const BugHuntIntakeForm: React.FC = () => {

    const workId: string | undefined = useParams().workId
    const navigate: NavigateFunction = useNavigate()

    const isMobile: boolean = useCheckIsMobile()
    const { isLoggedIn }: ProfileContextData = useContext<ProfileContextData>(profileContext)

    const [action, setAction]: [FormAction, Dispatch<SetStateAction<FormAction>>] = useState<FormAction>()
    const [loading, setLoading]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const [saveSuccess, setSaveSuccess]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const defaultPackage: PricePackageName = 'standard'

    BugHuntFormConfig.buttons.primaryGroup[0].onClick = () => { setAction('save') }
    BugHuntFormConfig.buttons.primaryGroup[0].hidden = !isLoggedIn
    BugHuntFormConfig.buttons.primaryGroup[1].onClick = () => { setAction('submit') }
    if (BugHuntFormConfig.buttons.secondaryGroup) {
        BugHuntFormConfig.buttons.secondaryGroup[0].onClick = () => { navigate(selfServiceStartRoute) }
    }

    if (isMobile) {
        BugHuntFormConfig.buttons.primaryGroup[0].icon = SaveForLaterIcon
        BugHuntFormConfig.buttons.primaryGroup[0].label = ''
        BugHuntFormConfig.buttons.primaryGroup[1].label = 'Submit'
    } else {
        BugHuntFormConfig.buttons.primaryGroup[0].icon = undefined
        BugHuntFormConfig.buttons.primaryGroup[0].label = 'Save for later'
        BugHuntFormConfig.buttons.primaryGroup[1].label = 'Complete and pay'
    }

    const [challenge, setChallenge]: [Challenge | undefined, Dispatch<SetStateAction<Challenge | undefined>>]
        = useState()
    const [formDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...BugHuntFormConfig })

    const [formValues, setFormValues]: [any, Dispatch<any>] = useState({
        currentStep: 'basicInfo',
        [ChallengeMetadataName.packageType]: defaultPackage,
    })

    const [selectedPackage, setSelectedPackage]: [PricePackageName, Dispatch<SetStateAction<PricePackageName>>]
        = useState<PricePackageName>(formValues?.packageType)

    const [disableSaveForLater, setDisableSaveForLater]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(true)

    useEffect(() => {

        async function getAndSetWork(): Promise<void> {

            if (!isLoggedIn) {
                return
            }

            if (!workId) {
                const newChallenge: Challenge = await workCreateAsync(WorkType.bugHunt)
                setChallenge(newChallenge)
                return
            }

            // fetch challenge using workId
            const response: Challenge = await workGetByWorkIdAsync(workId)
            setChallenge(response)

            const intakeFormBH: ChallengeMetadata | undefined = response.metadata
                ?.find((item: ChallengeMetadata) => item.name === ChallengeMetadataName.intakeForm)

            if (!intakeFormBH) {
                return
            }

            const formData: Record<string, any> = JSON.parse(intakeFormBH.value).form.basicInfo

            setFormValues(formData)

            if (formData?.packageType) {
                setSelectedPackage(formData.packageType)
            } else {
                setFormValues({
                    ...formValues,
                    [ChallengeMetadataName.packageType]: defaultPackage,
                })
            }
        }

        setLoading(true)
        getAndSetWork()
            .finally(() => setLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isLoggedIn,
        workId,
    ])

    const handleSaveSuccess: () => void = () => {
        if (action === 'save') {
            navigate(`${workDashboardRoute}/draft`)
        } else if (action === 'submit') {
            const nextUrl: string = `${WorkIntakeFormRoutes[WorkType.bugHunt].review}/${workId || challenge?.id}`
            navigate(nextUrl)
        }
    }

    useEffect(() => {
        if (!loading && saveSuccess) {
            handleSaveSuccess()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, saveSuccess])

    const requestGenerator: (inputs: ReadonlyArray<FormInputModel>) => any
        = useCallback((inputs: ReadonlyArray<FormInputModel>) => {
            const projectTitle: string = formGetInputModel(inputs, ChallengeMetadataName.projectTitle).value as string
            const featuresToTest: string
                = formGetInputModel(inputs, ChallengeMetadataName.featuresToTest).value as string
            const deliveryType: string = formGetInputModel(inputs, ChallengeMetadataName.deliveryType).value as string
            const repositoryLink: string
                = formGetInputModel(inputs, ChallengeMetadataName.repositoryLink).value as string
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
        }, [])

    function onChange(inputs: ReadonlyArray<FormInputModel>): void {
        const packageType: PricePackageName
            = formGetInputModel(inputs, ChallengeMetadataName.packageType).value as PricePackageName

        if (packageType !== selectedPackage) {
            setSelectedPackage(packageType)
        }

        // If there's no project title, we should disable SAVE FOR LATER button
        const title: string = formGetInputModel(inputs, ChallengeMetadataName.projectTitle).value as string
        setDisableSaveForLater(!title?.trim())
    }

    function goToLoginStep(formData: any): void {
        if (localStorage) {
            localStorage.setItem('challengeInProgress', JSON.stringify(formData))
            localStorage.setItem('challengeInProgressType', WorkType.bugHunt)
        }

        const returnUrl: string
            = encodeURIComponent(`${window.location.origin}${WorkIntakeFormRoutes[WorkType.bugHunt].saveAfterLogin}`)
        const loginPromptUrl: string = `${WorkIntakeFormRoutes[WorkType.bugHunt].loginPrompt}/${returnUrl}`
        navigate(loginPromptUrl)
    }

    function onSave(val: any): Promise<void> {
        if (!isLoggedIn) {
            goToLoginStep(val)
            return Promise.reject()
        }

        if (!challenge) { return Promise.resolve() }

        if (action === 'save') {
            val.currentStep = 'basicInfo'
        } else if (action === 'submit') {
            val.currentStep = 'review'
        }

        setLoading(true)
        return workUpdateAsync(WorkType.bugHunt, challenge, val)
            .finally(() => setLoading(false))
    }

    function onSaveSuccess(): void {
        setSaveSuccess(true)
    }

    /**
     * This function is used to decide whether SAVE FOR LATER button should be enabled or not
     * @param isPrimaryGroup whether its a primary group or not
     * @param index the index of the button
     * @returns true or false depending on whether its SAVE FOR LATER
     */
    const shouldDisableButton: (isPrimaryGroup: boolean, index: number) => boolean
        = useCallback((isPrimaryGroup: boolean, index: number) => {

            // SAVE FOR LATER belongs to primary group and its index is 0,
            // we are interested only for that particular case
            // else return false which means not disabled from this function
            if (isPrimaryGroup && index === 0) {
                return disableSaveForLater
            }

            return false
        }, [disableSaveForLater])

    return (
        <>
            <LoadingSpinner hide={!loading} type='Overlay' />
            <IntakeFormsBreadcrumb
                basicInfoRoute={WorkIntakeFormRoutes[WorkType.bugHunt].basicInfo}
                workType={workBugHuntConfig.type}
            />
            <div className={styles['bug-hunt-wrapper']}>
                <WorkTypeBanner
                    title={workBugHuntConfig.title}
                    subTitle={workBugHuntConfig.subtitle}
                    workType={workBugHuntConfig.type}
                />
                <WorkServicePrice
                    duration={workBugHuntConfig.duration?.[selectedPackage] || 0}
                    hideTitle
                    icon={<IconOutline.BadgeCheckIcon width={48} height={48} />}
                    iconClass={styles['bug-hunt-icon']}
                    price={workBugHuntConfig.priceConfig.getPrice(workBugHuntConfig.priceConfig, selectedPackage)}
                    serviceType={workBugHuntConfig.type}
                    showIcon
                />
                <div>
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
                        shouldDisableButton={shouldDisableButton}
                    />
                </div>
            </div>
        </>
    )
}

export default BugHuntIntakeForm
