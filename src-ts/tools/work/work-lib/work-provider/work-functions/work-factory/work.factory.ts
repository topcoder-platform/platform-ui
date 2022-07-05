import moment from 'moment'

import {
    Challenge,
    ChallengeMetadata,
    ChallengeMetadataName,
    ChallengePhase,
    ChallengePhaseName,
    WorkPrice,
    WorkPrices
} from '../work-store'

import { ChallengeStatus } from './challenge-status.enum'
import { WorkProgressStep } from './work-progress-step.model'
import { WorkProgress } from './work-progress.model'
import { WorkStatus } from './work-status.enum'
import { WorkTypeCategory } from './work-type-category.enum'
import { WorkType } from './work-type.enum'
import { Work } from './work.model'

interface FormDetail {
    key: string,
    title: string,
    value: any
}

interface IntakeForm {
    basicInfo?: {
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

export function create(challenge: Challenge): Work {

    const status: WorkStatus = getStatus(challenge)
    const submittedDate: Date | undefined = getSubmittedDate(challenge)
    const type: WorkType = getType(challenge)

    return {
        cost: getCost(challenge, type),
        created: submittedDate,
        description: getDescription(challenge, type),
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
        default:
            return formData
    }
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

// the switch statement shouldn't count against cyclomatic complexity
// tslint:disable-next-line: cyclomatic-complexity
function getCost(challenge: Challenge, type: WorkType): number | undefined {

    const priceConfig: WorkPrice = WorkPrices[type]
    switch (type) {

        case WorkType.designLegacy:

            // get the device and page count from the intake form from the metadata
            const intakeForm: ChallengeMetadata | undefined = findMetadata(challenge, ChallengeMetadataName.intakeForm)
            const form: IntakeForm = !!intakeForm?.value ? JSON.parse(intakeForm.value)?.form : undefined
            const legacyPageCount: number | undefined = form?.pageDetails?.pages?.length || 1
            const legacyDeviceCount: number | undefined = form?.basicInfo?.selectedDevice?.option?.length
            return priceConfig.getPrice(priceConfig, legacyPageCount, legacyDeviceCount)

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
        .find(([key, value]) => value === form.form.workType?.selectedWorkType)
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
