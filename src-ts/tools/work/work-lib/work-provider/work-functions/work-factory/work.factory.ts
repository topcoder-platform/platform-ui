import moment from 'moment'

import { WorkConfigConstants, WorkStrings } from '../../../work-constants'
import {
    Challenge,
    ChallengeCreateBody,
    ChallengeMetadata,
    ChallengeMetadataName,
    ChallengeMetadataTitle,
    ChallengePhase,
    ChallengePhaseName,
    ChallengeUpdateBody,
    PricePackageName,
    Work,
    WorkPrice,
    WorkPricesType,
    WorkProgress,
    WorkProgressStep,
    WorkStatus,
    WorkTimelinePhase,
    WorkType,
    WorkTypeCategory,
    WorkTypeConfig,
} from '../work-store'

import { ChallengeStatus } from './challenge-status.enum'

export interface FormDetail {
    key: string,
    title: string,
    value: any
}

interface IntakeForm {
    basicInfo?: {
        packageType?: string,
        selectedDevice?: {
            option?: Array<any>,
        }
    }
    pageDetails?: {
        pages?: Array<any>,
    }
    workType: {
        selectedWorkType: WorkType
    }
}

export function create(challenge: Challenge, workPrices: WorkPricesType): Work {

    const status: WorkStatus = getStatus(challenge)
    const submittedDate: Date | undefined = getSubmittedDate(challenge)
    const type: WorkType = getType(challenge)
    const priceConfig: WorkPrice = workPrices[type]

    return {
        cost: getCost(challenge, priceConfig, type),
        created: submittedDate,
        description: getDescription(challenge, type),
        draftStep: getDraftStep(challenge, status),
        id: challenge.id,
        messageCount: Number((Math.random() * 10).toFixed(0)), // TODO: real message count
        participantsCount: challenge.numOfRegistrants,
        progress: getProgress(challenge, status),
        solutionsCount: challenge.numOfSubmissions,
        solutionsReadyDate: getSolutionsReadyDate(challenge),
        status,
        submittedDate,
        title: challenge.name,
        type,
        typeCategory: getTypeCategory(type),
    }
}

export function buildCreateBody(workTypeConfig: WorkTypeConfig): ChallengeCreateBody {

    const form: IntakeForm = {
        workType: {
            selectedWorkType: workTypeConfig.type,
        },
    }

    return {
        description: WorkStrings.INFO_NOT_PROVIDED,
        discussions: [
            {
                name: 'new-self-service-project',
                provider: 'vanilla',
                type: 'challenge',
            },
        ],
        legacy: {
            selfService: true,
        },
        metadata: [
            {
                name: ChallengeMetadataName.intakeForm,
                value: JSON.stringify({ form }),
            },
            {
                name: ChallengeMetadataName.currentStep,
                value: 'basicInfo',
            },
        ],
        name: 'new-self-service-project',
        tags: workTypeConfig.tags,
        timelineTemplateId: workTypeConfig.timelineTemplateId,
        trackId: workTypeConfig.trackId,
        typeId: workTypeConfig.typeId,
    }
}

export function buildUpdateBody(workTypeConfig: WorkTypeConfig, challenge: Challenge, formData: any): ChallengeUpdateBody {

    const type: WorkType = workTypeConfig.type
    const priceConfig: WorkPrice = workTypeConfig.priceConfig

    const intakeForm: ChallengeMetadata | undefined = findMetadata(challenge, ChallengeMetadataName.intakeForm) || undefined
    const form: IntakeForm = !!intakeForm?.value ? JSON.parse(intakeForm.value)?.form : {}
    form.basicInfo = formData

    // --- Build Metadata --- //
    const intakeMetadata: Array<ChallengeMetadata> = [
        {
            name: ChallengeMetadataName.intakeForm,
            value: JSON.stringify({ form }),
        },
    ]

    Object.keys(formData).forEach((key) => {
        intakeMetadata.push({
            name: ChallengeMetadataName[key as keyof typeof ChallengeMetadataName],
            value: formData[key] || '',
        })
    })
    // ---- End Build Metadata ---- //

    // --- Build the Markdown string that gets displayed in Work Manager app and others --- //
    const templateString: Array<string> = []

    const data: ReadonlyArray<FormDetail> = mapFormData(
        type,
        formData
    )

    data.forEach((formDetail) => {
        if (Object.keys(formDetail).length <= 0) { return }

        const formattedValue: string = formatFormDataOption(formDetail.value)
        templateString.push(`### ${formDetail.title}\n\n${formattedValue}\n\n`)
    })

    if (getTypeCategory(type) === WorkTypeCategory.data) {
        templateString.push(
            WorkStrings.MARKDOWN_SUBMISSION_GUIDELINES
        )
    }
    // ---- End Build Markdown string ---- //

    // If the duration of the Submission phase depends on the package selected (i.e.: Bug Hunt),
    // then update the duration for that phase to the correct value
    const timeline: Array<WorkTimelinePhase> = workTypeConfig.timeline.map((phase) => {
        if (workTypeConfig.submissionPhaseDuration && phase.phaseId === WorkConfigConstants.PHASE_ID_SUBMISSION) {
            phase.duration = workTypeConfig.submissionPhaseDuration[formData[ChallengeMetadataName.packageType] as PricePackageName] || 0
        }
        return phase
    })

    const body: ChallengeUpdateBody = {
        description: templateString.join(''),
        id: challenge.id,
        metadata: intakeMetadata,
        name: formData.projectTitle,
        phases: timeline,
        prizeSets: priceConfig.getPrizeSets(priceConfig, formData.packageType),
    }

    return body
}

export function getStatus(challenge: Challenge): WorkStatus {

    switch (challenge.status) {

        case ChallengeStatus.new:
            return WorkStatus.draft

        case ChallengeStatus.active:
        case ChallengeStatus.approved:
        case ChallengeStatus.draft:
            return WorkStatus.active

        case ChallengeStatus.completed:
            const customerFeedback: ChallengeMetadata | undefined = findMetadata(challenge, ChallengeMetadataName.feedback)
            return !customerFeedback ? WorkStatus.ready : WorkStatus.done

        case ChallengeStatus.cancelled:
        case ChallengeStatus.cancelledPaymentFailed:
        case ChallengeStatus.cancelledRequirementsInfeasible:
            return WorkStatus.transferred

        default:
            return WorkStatus.deleted
    }
}

// NOTE: This function is only used by the new intakes and not the Legacy Web Design
export function mapFormData(type: string, formData: any): ReadonlyArray<FormDetail> {
    switch (type) {
        case (WorkType.problem):
            return buildFormDataProblem(formData)
        case (WorkType.data):
            return buildFormDataData(formData)
        case (WorkType.findData):
            return buildFormDataFindData(formData)
        case (WorkType.design):
            return buildFormDataDesign(formData)
        case (WorkType.bugHunt):
            return buildFormDataBugHunt(formData)
        default:
            return formData
    }
}
function buildFormDataBugHunt(formData: any): ReadonlyArray<FormDetail> {
    return [
        {
            key: ChallengeMetadataName.projectTitle,
            title: ChallengeMetadataTitle.projectTitle,
            value: formData.projectTitle,
        },
        {
            key: ChallengeMetadataName.websiteURL,
            title: ChallengeMetadataTitle.websiteURL,
            value: formData.websiteURL,
        },
        {
            key: ChallengeMetadataName.goals,
            title: ChallengeMetadataTitle.bugHuntGoals,
            value: formData.goals,
        },
        {
            key: ChallengeMetadataName.featuresToTest,
            title: ChallengeMetadataTitle.featuresToTest,
            value: formData.featuresToTest,
        },
        {
            key: ChallengeMetadataName.deliveryType,
            title: ChallengeMetadataTitle.bugDeliveryType,
            value: `${formData.deliveryType}${formData.repositoryLink ? ': ' + formData.repositoryLink : ''}`,
        },
        {
            key: ChallengeMetadataName.additionalInformation,
            title: ChallengeMetadataTitle.additionalInformation,
            value: formData.additionalInformation,
        },
        {
            key: ChallengeMetadataName.packageType,
            title: ChallengeMetadataTitle.bugHuntPackage,
            value: formData.packageType,
        },
    ]
}

function buildFormDataData(formData: any): ReadonlyArray<FormDetail> {
    return [
        {
            key: 'projectTitle',
            ...formData.projectTitle,
        },
        {
            key: 'data',
            title: 'Share Your Data (Optional)',
            value: formData.assetsUrl?.value,
        },
        {
            key: 'goal',
            title: 'What Would You Like To Learn?',
            value: formData.goals?.value,
        },
    ]
}

function buildFormDataDesign(formData: any): ReadonlyArray<FormDetail> {
    const styleInfo: {} = {
        Like: formData.likedStyles?.value?.join(', '),
        // Disabling lint error to maintain order for display
        // tslint:disable-next-line: object-literal-sort-keys
        Dislike: formData.dislikedStyles?.value?.join(', '),
        'Additional Details': formData.stylePreferences?.value,
        'Color Selections': formData.colorOption?.value.join(', '),
        'Specific Colors': formData.specificColor?.value,
    }

    return [
        {
            key: 'projectTitle',
            ...formData.projectTitle,
        },
        {
            key: 'description',
            title: 'Description',
            value: formData.analysis?.value,
        },
        {
            key: 'industry',
            title: 'Your Industry',
            value: formData.yourIndustry?.value,
        },
        {
            key: 'inspiration',
            title: 'Inspiration',
            value: formData.inspiration
                ?.map((item: any) => `${item.website?.value} ${item.feedback?.value}`)
                .filter((item: any) => item?.trim().length > 0),
        },
        {
            key: 'style',
            title: 'Style & Theme',
            value: styleInfo,
        },
        {
            key: 'assets',
            title: 'Share Your Brand or Style Assets',
            value: [formData.assetsUrl?.value, formData.assetsDescription?.value]
                .filter((item: any) => item?.trim().length > 0),
        },
    ]
}

function buildFormDataFindData(formData: any): ReadonlyArray<FormDetail> {
    const isPrimaryDataChallengeOther: boolean = formData.primaryDataChallenge?.value === 3
    return [
        {
            key: 'projectTitle',
            ...formData.projectTitle,
        },
        {
            key: 'data',
            ...formData.analysis,
        },
        {
            key: 'primaryDataChallenge',
            title: formData.primaryDataChallenge?.title,
            value: isPrimaryDataChallengeOther
                ? formData.primaryDataChallengeOther.value
                : formData.primaryDataChallenge?.option,
        },
        {
            key: 'sampleData',
            ...formData.sampleData,
        },
    ]
}

function buildFormDataProblem(formData: any): ReadonlyArray<FormDetail> {
    return [
        {
            key: 'projectTitle',
            ...formData.projectTitle,
        },
        {
            key: 'goal',
            title: 'What\'s Your Goal?',
            value: formData.goals?.value,
        },
        {
            key: 'data',
            title: 'What Data Do You Have?',
            value: [
                formData.sampleData?.value,
                formData.assetsDescription?.value,
            ].filter((item: any) => item?.trim().length > 0),
        },
    ]
}

/**
 * This function checks if the param provided is empty based on its type
 * The param is empty if: is falsey || is an empty string || is an empty array || is an empty object
 * This is used for determining if a form field entry is emtpy after being formatted for display
 */
function checkFormDataOptionEmpty(detail: any): boolean {
    return (
        !detail ||
        (typeof detail === 'string' && detail.trim().length === 0) ||
        (Array.isArray(detail) && detail.length === 0) ||
        (typeof detail === 'object' &&
            Object.values(detail).filter((val: any) => val && val.trim().length !== 0)
                .length === 0)
    )
}

function findMetadata(challenge: Challenge, metadataName: ChallengeMetadataName): ChallengeMetadata | undefined {
    return challenge.metadata?.find((item: ChallengeMetadata) => item.name === metadataName)
}

function findOpenPhase(challenge: Challenge): ChallengePhase | undefined {

    // sort the phases descending by start date
    const sortedPhases: Array<ChallengePhase> = challenge.phases
        .sort((a, b) => new Date(b.actualStartDate).getTime() - new Date(a.actualStartDate).getTime())

    const now: Date = new Date()
    // if we have an open phase, just use that
    const openPhase: ChallengePhase | undefined = sortedPhases.find(phase => phase.isOpen)
        // otherwise, find the phase that _should_ be open now based on its start/end datetimes
        || sortedPhases
            .find(phase => {
                return new Date(phase.actualEndDate) > now && new Date(phase.actualStartDate) < now
            })
        // otherwise, find the most recently started phase that's in the past
        || sortedPhases
            .find(phase => {
                return new Date(phase.actualStartDate) < now
            })

    return openPhase
}

function findPhase(challenge: Challenge, phases: Array<string>): ChallengePhase | undefined {
    let phase: ChallengePhase | undefined
    let index: number = 0
    while (!phase && index < phases.length) {
        phase = challenge.phases.find((p: any) => p.name === phases[index])
        index++
    }
    return phase
}

function formatFormDataOption(detail: Array<string> | { [key: string]: any }): string {
    const noInfoProvidedText: string = WorkStrings.NOT_PROVIDED
    const isEmpty: boolean = checkFormDataOptionEmpty(detail)

    if (isEmpty) {
        return noInfoProvidedText
    }
    if (Array.isArray(detail)) {
        return detail.join('\n\n')
    }
    if (typeof detail === 'object') {
        return Object.keys(detail)
            .map((key: string) => {
                const value: string = detail[key] || noInfoProvidedText
                return `${key}: ${value}`
            })
            .join('\n\n')
    }
    return detail
}

function getCost(challenge: Challenge, priceConfig: WorkPrice, type: WorkType): number | undefined {

    switch (type) {

        case WorkType.designLegacy:

            // get the device and page count from the intake form from the metadata
            const intakeForm: ChallengeMetadata | undefined = findMetadata(challenge, ChallengeMetadataName.intakeForm)
            const form: IntakeForm = !!intakeForm?.value ? JSON.parse(intakeForm.value)?.form : undefined
            const legacyPageCount: number | undefined = form?.pageDetails?.pages?.length || 1
            const legacyDeviceCount: number | undefined = form?.basicInfo?.selectedDevice?.option?.length
            return priceConfig.getPrice(priceConfig, legacyPageCount, legacyDeviceCount)

        case WorkType.bugHunt:
            // get the selected package from the intake form
            const intakeFormBH: ChallengeMetadata | undefined = findMetadata(challenge, ChallengeMetadataName.intakeForm)
            const formBH: IntakeForm = !!intakeFormBH?.value ? JSON.parse(intakeFormBH.value)?.form : undefined
            return priceConfig.getPrice(priceConfig, formBH?.basicInfo?.packageType)

        default:
            return priceConfig.getPrice(priceConfig)
    }
}

function getDescription(challenge: Challenge, type: WorkType): string | undefined {

    switch (type) {

        case WorkType.data:
            return findMetadata(challenge, ChallengeMetadataName.goals)?.value

        case WorkType.design:
        case WorkType.designLegacy:
            return findMetadata(challenge, ChallengeMetadataName.description)?.value
    }
}

function getDraftStep(challenge: Challenge, status: WorkStatus): string | undefined {

    if (status !== WorkStatus.draft) { return undefined }

    const currentStep: ChallengeMetadata | undefined = findMetadata(challenge, ChallengeMetadataName.currentStep)
    return currentStep?.value
}

function getProgress(challenge: Challenge, workStatus: WorkStatus): WorkProgress {

    const steps: ReadonlyArray<WorkProgressStep> = [
        {
            date: getSubmittedDate(challenge),
            name: 'Submitted',
        },
        {
            date: getProgressStepDateStart(challenge, [ChallengePhaseName.registration]),
            name: 'Started',
        },
        {
            date: getProgressStepDateEnd(challenge, [
                ChallengePhaseName.approval,
                ChallengePhaseName.review,
                ChallengePhaseName.appeals,
                ChallengePhaseName.appealsResponse,
            ]),
            name: 'In Review',
        },
        {
            date: getSolutionsReadyDate(challenge),
            name: 'Solutions Ready',
        },
        {
            date: workStatus === WorkStatus.done && !!challenge.updated
                ? new Date(challenge.updated)
                : undefined,
            name: 'Done',
        },
    ]

    return {
        activeStepIndex: getProgressStepActive(challenge, workStatus),
        steps,
    }
}

function getProgressStepActive(challenge: Challenge, workStatus: WorkStatus): number {

    switch (challenge.status) {

        case ChallengeStatus.active:
        case ChallengeStatus.approved:

            const openPhase: ChallengePhase | undefined = findOpenPhase(challenge)
            // if we don't have an open phase, just return submitted
            if (!openPhase) {
                return 0
            }

            switch (openPhase.name) {
                case ChallengePhaseName.registration:
                    return 0
                case ChallengePhaseName.submission:
                    return 1
                default:
                    return 2
            }

        case ChallengeStatus.completed:
            return workStatus === WorkStatus.ready ? 3 : 4

        default:
            return 0
    }
}

function getProgressStepDateEnd(challenge: Challenge, phases: Array<string>): Date | undefined {

    const phase: ChallengePhase | undefined = findPhase(challenge, phases)
    if (!phase) {
        return undefined
    }

    if (phase.isOpen || moment(phase.scheduledStartDate).isAfter()) {
        return new Date(phase.scheduledEndDate)
    }

    return new Date(phase.actualEndDate || phase.scheduledEndDate)
}

function getProgressStepDateStart(challenge: Challenge, phases: Array<string>): Date | undefined {

    const phase: ChallengePhase | undefined = findPhase(challenge, phases)
    if (!phase) {
        return undefined
    }

    if (!phase.isOpen || moment(phase.scheduledStartDate).isAfter()) {
        return new Date(phase.scheduledStartDate)
    }

    return new Date(phase.actualStartDate)
}

function getSolutionsReadyDate(challenge: Challenge): Date | undefined {
    return getProgressStepDateEnd(challenge, [ChallengePhaseName.approval, ChallengePhaseName.appealsResponse])
}

function getSubmittedDate(challenge: Challenge): Date {
    return new Date(challenge.created)
}

function getType(challenge: Challenge): WorkType {

    // get the intake form from the metadata
    const intakeForm: ChallengeMetadata | undefined = findMetadata(challenge, ChallengeMetadataName.intakeForm)
    if (!intakeForm?.value) {
        return WorkType.unknown
    }

    // parse the form
    const form: { form: IntakeForm } = JSON.parse(intakeForm.value)
    const workTypeKey: (keyof typeof WorkType) | undefined = Object.entries(WorkType)
        .find(([key, value]) => value === form.form?.workType?.selectedWorkType)
        ?.[0] as keyof typeof WorkType

    const output: WorkType = !!workTypeKey ? WorkType[workTypeKey] : WorkType.unknown
    return output
}

function getTypeCategory(type: WorkType): WorkTypeCategory {

    switch (type) {

        case WorkType.data:
        case WorkType.findData:
        case WorkType.problem:
            return WorkTypeCategory.data

        case WorkType.design:
        case WorkType.designLegacy:
            return WorkTypeCategory.design

        // TOOD: other categories: qa and dev
        default:
            return WorkTypeCategory.unknown
    }
}
