import { ReactComponent as IconArrowLeft } from './arrow-left.svg'
import { ReactComponent as IconExternalLink } from './external-link.svg'
import { ReactComponent as IconChevronDown } from './selector.svg'
import { ReactComponent as IconError } from './icon-error.svg'
import { ReactComponent as IconAiReview } from './icon-ai-review.svg'
import { ReactComponent as IconSubmission } from './icon-phase-submission.svg'
import { ReactComponent as IconRegistration } from './icon-phase-registration.svg'
import { ReactComponent as IconPhaseReview } from './icon-phase-review.svg'
import { ReactComponent as IconAppeal } from './icon-phase-appeal.svg'
import { ReactComponent as IconAppealResponse } from './icon-phase-appeal-response.svg'
import { ReactComponent as IconPhaseWinners } from './icon-phase-winners.svg'
import { ReactComponent as IconDeepseekAi } from './deepseek.svg'
import { ReactComponent as IconClock } from './icon-clock.svg'
import { ReactComponent as IconPremium } from './icon-premium.svg'
import { ReactComponent as IconComment } from './icon-comment.svg'
import { ReactComponent as IconEdit } from './icon-edit.svg'

export * from './editor/bold'
export * from './editor/code'
export * from './editor/heading-1'
export * from './editor/heading-2'
export * from './editor/heading-3'
export * from './editor/image'
export * from './editor/italic'
export * from './editor/link'
export * from './editor/mentions'
export * from './editor/ordered-list'
export * from './editor/quote'
export * from './editor/strikethrough'
export * from './editor/table'
export * from './editor/unordered-list'
export * from './editor/upload-file'

export {
    IconArrowLeft,
    IconExternalLink,
    IconChevronDown,
    IconError,
    IconAiReview,
    IconSubmission,
    IconPhaseReview,
    IconAppeal,
    IconAppealResponse,
    IconPhaseWinners,
    IconDeepseekAi,
    IconClock,
    IconPremium,
    IconComment,
    IconEdit,
}

export const phasesIcons = {
    appeal: IconAppeal,
    appealResponse: IconAppealResponse,
    'iterative review': IconPhaseReview,
    registration: IconRegistration,
    review: IconPhaseReview,
    submission: IconSubmission,
}
