import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'
import { toast } from 'react-toastify'

import {
    ChallengeTrack,
    ChallengeType,
    DefaultChallengeReviewer,
    FormAddDefaultReviewer,
    Phase,
    Scorecard,
    TimelineTemplate,
} from '../models'
import { handleError } from '../utils'
import {
    createDefaultReviewer,
    deleteDefaultReviewer,
    getChallengeTracks,
    getChallengeTypes,
    getDefaultReviewerById,
    getPhases,
    getScorecards,
    getTimelineTemplates,
    updateDefaultReviewer,
} from '../services'

import { useOnComponentDidMount } from './useOnComponentDidMount'

export interface useManageAddDefaultReviewerProps {
    defaultReviewerInfo?: DefaultChallengeReviewer
    challengeTypes: ChallengeType[]
    isFetchingChallengeTypes: boolean
    challengeTracks: ChallengeTrack[]
    isFetchingChallengeTracks: boolean
    timelineTemplates: TimelineTemplate[]
    isFetchingTimelineTemplates: boolean
    scorecards: Scorecard[]
    isFetchingScorecards: boolean
    phases: Phase[]
    isFetchingPhases: boolean
    doAddDefaultReviewer: (
        data: Partial<FormAddDefaultReviewer>,
        callBack: () => void,
    ) => void
    doUpdateDefaultReviewer: (
        data: Partial<FormAddDefaultReviewer>,
        callBack: () => void,
    ) => void
    doRemoveDefaultReviewer: (callBack: () => void) => void
    isAdding: boolean
    isLoadingDefaultReviewer: boolean
    isRemoving: boolean
    isLoading: boolean
}

export function useManageAddDefaultReviewer(
    defaultReviewerId?: string,
): useManageAddDefaultReviewerProps {
    const [defaultReviewerInfo, setDefaultReviewerInfo] = useState<DefaultChallengeReviewer>()

    const [challengeTypes, setChallengeTypes] = useState<ChallengeType[]>([])
    const [isFetchingChallengeTypes, setIsFetchingChallengeTypes] = useState(false)

    const [challengeTracks, setChallengeTracks] = useState<ChallengeTrack[]>([])
    const [isFetchingChallengeTracks, setIsFetchingChallengeTracks] = useState(false)

    const [timelineTemplates, setTimelineTemplates] = useState<TimelineTemplate[]>([])
    const [isFetchingTimelineTemplates, setIsFetchingTimelineTemplates] = useState(false)

    const [scorecards, setScorecards] = useState<Scorecard[]>([])
    const [isFetchingScorecards, setIsFetchingScorecards] = useState(false)

    const [phases, setPhases] = useState<Phase[]>([])
    const [isFetchingPhases, setIsFetchingPhases] = useState(false)

    const [isAdding, setIsAdding] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)
    const [isLoadingDefaultReviewer, setIsLoadingDefaultReviewer] = useState(false)
    const isLoadingDefaultReviewerRef = useRef(false)

    useOnComponentDidMount(() => {
        setIsFetchingChallengeTypes(true)
        getChallengeTypes()
            .then(result => {
                setChallengeTypes(result)
                setIsFetchingChallengeTypes(false)
            })
            .catch(e => {
                setIsFetchingChallengeTypes(false)
                handleError(e)
            })

        setIsFetchingChallengeTracks(true)
        getChallengeTracks()
            .then(result => {
                setChallengeTracks(result)
                setIsFetchingChallengeTracks(false)
            })
            .catch(e => {
                setIsFetchingChallengeTracks(false)
                handleError(e)
            })

        setIsFetchingTimelineTemplates(true)
        getTimelineTemplates()
            .then(result => {
                setTimelineTemplates(result)
                setIsFetchingTimelineTemplates(false)
            })
            .catch(e => {
                setIsFetchingTimelineTemplates(false)
                handleError(e)
            })

        setIsFetchingScorecards(true)
        getScorecards()
            .then(result => {
                setScorecards(result)
                setIsFetchingScorecards(false)
            })
            .catch(e => {
                setIsFetchingScorecards(false)
                handleError(e)
            })

        setIsFetchingPhases(true)
        getPhases()
            .then(result => {
                setPhases(result)
                setIsFetchingPhases(false)
            })
            .catch(e => {
                setIsFetchingPhases(false)
                handleError(e)
            })
    })

    const doFetchDefaultReviewer = useCallback(() => {
        if (!isLoadingDefaultReviewerRef.current && defaultReviewerId) {
            isLoadingDefaultReviewerRef.current = true
            setIsLoadingDefaultReviewer(isLoadingDefaultReviewerRef.current)
            getDefaultReviewerById(defaultReviewerId)
                .then(result => {
                    setDefaultReviewerInfo(result)
                    isLoadingDefaultReviewerRef.current = false
                    setIsLoadingDefaultReviewer(isLoadingDefaultReviewerRef.current)
                })
                .catch(e => {
                    isLoadingDefaultReviewerRef.current = false
                    setIsLoadingDefaultReviewer(isLoadingDefaultReviewerRef.current)
                    handleError(e)
                })
        }
    }, [defaultReviewerId])

    const doAddDefaultReviewer = useCallback(
        (data: Partial<FormAddDefaultReviewer>, callBack: () => void) => {
            setIsAdding(true)
            createDefaultReviewer(data)
                .then(() => {
                    toast.success('Default Reviewer added successfully', {
                        toastId: 'Add default reviewer',
                    })
                    setIsAdding(false)
                    callBack()
                })
                .catch(e => {
                    setIsAdding(false)
                    handleError(e)
                })
        },
        [],
    )

    const doUpdateDefaultReviewer = useCallback(
        (data: Partial<FormAddDefaultReviewer>, callBack: () => void) => {
            setIsAdding(true)
            updateDefaultReviewer(defaultReviewerId ?? '', data)
                .then(() => {
                    toast.success('Default Reviewer updated successfully', {
                        toastId: 'Update default reviewer',
                    })
                    setIsAdding(false)
                    callBack()
                })
                .catch(e => {
                    setIsAdding(false)
                    handleError(e)
                })
        },
        [defaultReviewerId],
    )

    const doRemoveDefaultReviewer = useCallback(
        (callBack: () => void) => {
            setIsRemoving(true)
            deleteDefaultReviewer(defaultReviewerId ?? '')
                .then(() => {
                    toast.success('Default Reviewer removed successfully', {
                        toastId: 'Remove default reviewer',
                    })
                    setIsRemoving(false)
                    callBack()
                })
                .catch(e => {
                    setIsRemoving(false)
                    handleError(e)
                })
        },
        [defaultReviewerId],
    )

    useEffect(() => {
        doFetchDefaultReviewer()
    }, [doFetchDefaultReviewer])

    return {
        challengeTracks,
        challengeTypes,
        defaultReviewerInfo,
        doAddDefaultReviewer,
        doRemoveDefaultReviewer,
        doUpdateDefaultReviewer,
        isAdding,
        isFetchingChallengeTracks,
        isFetchingChallengeTypes,
        isFetchingPhases,
        isFetchingScorecards,
        isFetchingTimelineTemplates,
        isLoading:
            isLoadingDefaultReviewer || isAdding || isRemoving,
        isLoadingDefaultReviewer,
        isRemoving,
        phases,
        scorecards,
        timelineTemplates,
    }
}
