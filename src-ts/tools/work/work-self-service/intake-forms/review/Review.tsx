import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { WorkDetailDetailsPane } from '../../../work-detail-details'
import {
    Challenge,
    ChallengeMetadataName,
    WorkType,
} from '../../../work-lib'
import { ChallengeMetadata, workStoreGetChallengeByWorkId } from '../../../work-lib/work-provider/work-functions/work-store'
import { WorkIntakeFormRoutes } from '../../../work-lib/work-provider/work-functions/work-store/work-intake-form-routes.config'
import { bugHuntConfig } from '../../../work-lib/work-provider/work-functions/work-store/work-type.config'
import { WorkTypeBanner } from '../../../work-type-banner'

import styles from './Review.module.scss'

const Review: React.FC = () => {
    const workId: string | undefined = useParams().workId
    const redirectUrl: string = WorkIntakeFormRoutes[WorkType.bugHunt]['basicInfo']

    const [challenge, setChallenge]: [Challenge | undefined, Dispatch<SetStateAction<Challenge | undefined>>] = useState()

    let formData: any = {}

    function findMetadata(metadataName: ChallengeMetadataName): ChallengeMetadata | undefined {
        return challenge?.metadata?.find((item: ChallengeMetadata) => item.name === metadataName)
    }

    useEffect(() => {
        const useEffectAsync: () => Promise<void> = async () => {
                // fetch challenge using workId
                const response: any = await workStoreGetChallengeByWorkId(workId)
                setChallenge(response)
        }

        useEffectAsync()
    }, [workId])

    if (challenge) {
        const intakeFormBH: ChallengeMetadata | undefined = findMetadata(ChallengeMetadataName.intakeForm)
        if (intakeFormBH) {
            formData = JSON.parse(intakeFormBH.value).form
        }
    }

    return (
        <div className={styles['review-container']}>
            <WorkTypeBanner
                title={bugHuntConfig.review.title}
                subTitle={bugHuntConfig.review.subtitle}
                workType={bugHuntConfig.review.type}
            />
            <div className={styles['content']}>
                <div className={styles['left']}>
                    <WorkDetailDetailsPane formData={formData} isReviewPage={true} redirectUrl={redirectUrl} collapsible={true} defaultOpen={true} />
                </div>
                <div className={styles['right']}></div>
            </div>
        </div>
    )
}

export default Review
