import {
    Dispatch,
    SetStateAction,
    useReducer,
    useRef,
} from 'react'

import { TABLE_PAGINATION_ITEM_PER_PAGE } from '../../config/index.config'
import {
    DefaultChallengeReviewer,
    DefaultChallengeReviewerWithNames,
    FormSearchDefaultReviewers,
} from '../models'
import { handleError } from '../utils'
import {
    DefaultReviewersResponsePayload,
    fetchAllDefaultReviewers,
    getChallengeTracks,
    getChallengeTypes,
    getScorecards,
    getTimelineTemplates,
} from '../services'

import {
    useTableFilterBackend,
    useTableFilterBackendProps,
} from './useTableFilterBackend'

type DefaultReviewersState = {
    isLoading: boolean
    datas: DefaultChallengeReviewerWithNames[]
    totalPages: number
}

const DefaultReviewersActionType = {
    FETCH_DEFAULT_REVIEWERS_DONE: 'FETCH_DEFAULT_REVIEWERS_DONE' as const,
    FETCH_DEFAULT_REVIEWERS_FAILED: 'FETCH_DEFAULT_REVIEWERS_FAILED' as const,
    FETCH_DEFAULT_REVIEWERS_INIT: 'FETCH_DEFAULT_REVIEWERS_INIT' as const,
}

type DefaultReviewersReducerAction =
    | {
          type:
              | typeof DefaultReviewersActionType.FETCH_DEFAULT_REVIEWERS_INIT
              | typeof DefaultReviewersActionType.FETCH_DEFAULT_REVIEWERS_FAILED
      }
    | {
          type: typeof DefaultReviewersActionType.FETCH_DEFAULT_REVIEWERS_DONE
          payload: {
              data: DefaultChallengeReviewerWithNames[]
              totalPages: number
          }
      }

const reducer = (
    previousState: DefaultReviewersState,
    action: DefaultReviewersReducerAction,
): DefaultReviewersState => {
    switch (action.type) {
        case DefaultReviewersActionType.FETCH_DEFAULT_REVIEWERS_INIT: {
            return {
                ...previousState,
                datas: [],
                isLoading: true,
            }
        }

        case DefaultReviewersActionType.FETCH_DEFAULT_REVIEWERS_DONE: {
            return {
                ...previousState,
                datas: action.payload.data,
                isLoading: false,
                totalPages: action.payload.totalPages,
            }
        }

        case DefaultReviewersActionType.FETCH_DEFAULT_REVIEWERS_FAILED: {
            return {
                ...previousState,
                isLoading: false,
            }
        }

        default: {
            return previousState
        }
    }
}

type ReferenceMaps = {
    typeMap: Map<string, string>
    trackMap: Map<string, string>
    timelineTemplateMap: Map<string, string>
    scorecardMap: Map<string, string>
}

const normalizeDefaultReviewers = (
    payload: DefaultReviewersResponsePayload,
): DefaultChallengeReviewer[] => {
    if (Array.isArray(payload)) {
        return payload
    }

    return payload.result ?? []
}

export interface useManageDefaultReviewersProps {
    datas: DefaultChallengeReviewerWithNames[]
    isLoading: boolean
    page: number
    setPage: Dispatch<SetStateAction<number>>
    reloadData: () => void
    setFilterCriteria: (
        criteria: FormSearchDefaultReviewers | undefined
    ) => void
    totalPages: number
}

export function useManageDefaultReviewers(): useManageDefaultReviewersProps {
    const [state, dispatch] = useReducer(reducer, {
        datas: [],
        isLoading: false,
        totalPages: 1,
    })

    const referenceMapsRef = useRef<ReferenceMaps>()

    const ensureReferenceMaps = async (): Promise<ReferenceMaps> => {
        if (referenceMapsRef.current) {
            return referenceMapsRef.current
        }

        const [
            challengeTypes,
            challengeTracks,
            timelineTemplates,
            scorecards,
        ] = await Promise.all([
            getChallengeTypes(),
            getChallengeTracks(),
            getTimelineTemplates(),
            getScorecards(),
        ])

        const typeMap = new Map(
            challengeTypes.map(type => [type.id, type.name]),
        )
        const trackMap = new Map(
            challengeTracks.map(track => [track.id, track.name]),
        )
        const timelineTemplateMap = new Map(
            timelineTemplates.map(template => [template.id, template.name]),
        )
        const scorecardMap = new Map(
            scorecards.map(scorecard => [scorecard.id, scorecard.name]),
        )

        referenceMapsRef.current = {
            scorecardMap,
            timelineTemplateMap,
            trackMap,
            typeMap,
        }

        return referenceMapsRef.current
    }

    const {
        page,
        setPage,
        reloadData,
        setFilterCriteria,
    }: useTableFilterBackendProps<FormSearchDefaultReviewers>
        = useTableFilterBackend<FormSearchDefaultReviewers>(
            (pagRequest, _sortRequest, filterCriteria, success, fail) => {
                dispatch({
                    type: DefaultReviewersActionType.FETCH_DEFAULT_REVIEWERS_INIT,
                })

                const encodeFilterValue = (value: string): string => encodeURIComponent(value)
                const filterSegments: string[] = [
                    `page=${pagRequest}`,
                    `perPage=${TABLE_PAGINATION_ITEM_PER_PAGE}`,
                ]

                if (filterCriteria?.typeId) {
                    filterSegments.push(`typeId=${encodeFilterValue(filterCriteria.typeId)}`)
                }

                if (filterCriteria?.trackId) {
                    filterSegments.push(`trackId=${encodeFilterValue(filterCriteria.trackId)}`)
                }

                if (filterCriteria?.timelineTemplateId) {
                    filterSegments.push(
                        `timelineTemplateId=${encodeFilterValue(filterCriteria.timelineTemplateId)}`,
                    )
                }

                const phaseNameFilter
                    = filterCriteria?.phaseName ?? filterCriteria?.searchKey
                if (phaseNameFilter) {
                    filterSegments.push(`phaseName=${encodeFilterValue(phaseNameFilter)}`)
                }

                if (filterCriteria?.scorecardId) {
                    filterSegments.push(
                        `scorecardId=${encodeFilterValue(filterCriteria.scorecardId)}`,
                    )
                }

                const filter = filterSegments.join('&')

                const loadData = async (): Promise<void> => {
                    try {
                        const result = await fetchAllDefaultReviewers(filter)

                        let referenceMaps: ReferenceMaps
                        try {
                            referenceMaps = await ensureReferenceMaps()
                        } catch (referenceError) {
                            handleError(referenceError)
                            referenceMaps = {
                                scorecardMap: new Map(),
                                timelineTemplateMap: new Map(),
                                trackMap: new Map(),
                                typeMap: new Map(),
                            }
                        }

                        const defaultReviewers = normalizeDefaultReviewers(result.data)

                        const enrichedRecords
                            = defaultReviewers.map(defaultReviewer => ({
                                ...defaultReviewer,
                                scorecardName: referenceMaps.scorecardMap.get(
                                    defaultReviewer.scorecardId,
                                ),
                                timelineTemplateName:
                                    defaultReviewer.timelineTemplateId
                                        ? referenceMaps.timelineTemplateMap.get(
                                            defaultReviewer.timelineTemplateId,
                                        )
                                        : undefined,
                                trackName: referenceMaps.trackMap.get(
                                    defaultReviewer.trackId,
                                ),
                                typeName: referenceMaps.typeMap.get(
                                    defaultReviewer.typeId,
                                ),
                            }))

                        dispatch({
                            payload: {
                                data: enrichedRecords,
                                totalPages: result.totalPages,
                            },
                            type: DefaultReviewersActionType.FETCH_DEFAULT_REVIEWERS_DONE,
                        })
                        success()
                        window.scrollTo({ left: 0, top: 0 })
                    } catch (error) {
                        dispatch({
                            type: DefaultReviewersActionType.FETCH_DEFAULT_REVIEWERS_FAILED,
                        })
                        handleError(error)
                        fail()
                    }
                }

                loadData()
                    .catch(() => undefined)
            },
            undefined,
        )

    return {
        datas: state.datas,
        isLoading: state.isLoading,
        page,
        reloadData,
        setFilterCriteria,
        setPage,
        totalPages: state.totalPages,
    }
}
