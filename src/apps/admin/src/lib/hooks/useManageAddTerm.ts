/**
 * Manage add term
 */
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'
import { toast } from 'react-toastify'

import {
    FormAddTerm,
    TermAgreeabilityType,
    TermType,
    UserTerm,
} from '../models'
import { handleError } from '../utils'
import {
    createTerm,
    editTerm,
    fetchAllTermsAgreeabilityTypes,
    fetchAllTermsTypes,
    fetchAllTermsUsers,
    findTermsById,
    removeTerm,
} from '../services'

import { useOnComponentDidMount } from './useOnComponentDidMount'

export interface useManageAddTermProps {
    signedUsersTotal: number
    termInfo?: UserTerm
    termsTypes: TermType[]
    isFetchingTermsTypes: boolean
    termsAgreeabilityTypes: TermAgreeabilityType[]
    isFetchingTermsAgreeabilityTypes: boolean
    doAddTerm: (data: Partial<FormAddTerm>, callBack: () => void) => void
    doUpdateTerm: (data: Partial<FormAddTerm>, callBack: () => void) => void
    doRemoveTerm: (callBack: () => void) => void
    isAdding: boolean
    isLoadingTerm: boolean
    isRemoving: boolean
    isLoading: boolean
}

/**
 * Manage add term
 *
 * @param termId term id
 * @returns add term info
 */
export function useManageAddTerm(termId?: string): useManageAddTermProps {
    const [signedUsersTotal, setSignedUsersTotal] = useState(0)
    const [termInfo, setTermInfo] = useState<UserTerm>()
    const [isFetchingTermsTypes, setIsFetchingTermsTypes] = useState(false)
    const [termsTypes, setTermsTypes] = useState<TermType[]>([])
    const [isAdding, setIsAdding] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)
    const [isLoadingTerm, setIsLoadingTerm] = useState(false)
    const isLoadingTermRef = useRef(false)

    const [
        isFetchingTermsAgreeabilityTypes,
        setIsFetchingTermsAgreeabilityTypes,
    ] = useState(false)
    const [termsAgreeabilityTypes, setTermsAgreeabilityTypes] = useState<
        TermAgreeabilityType[]
    >([])

    useOnComponentDidMount(() => {
        setIsFetchingTermsTypes(true)
        fetchAllTermsTypes()
            .then(result => {
                setIsFetchingTermsTypes(false)
                setTermsTypes(result)
            })
            .catch(e => {
                setIsFetchingTermsTypes(false)
                handleError(e)
            })

        setIsFetchingTermsAgreeabilityTypes(true)
        fetchAllTermsAgreeabilityTypes()
            .then(result => {
                setIsFetchingTermsAgreeabilityTypes(false)
                setTermsAgreeabilityTypes(result)
            })
            .catch(e => {
                setIsFetchingTermsAgreeabilityTypes(false)
                handleError(e)
            })
    })

    /**
     * Fetch term info
     */
    const doFetchTerm = useCallback(() => {
        if (!isLoadingTermRef.current && termId) {
            isLoadingTermRef.current = true
            setIsLoadingTerm(isLoadingTermRef.current)
            findTermsById(termId)
                .then(termInfoResult => {
                    fetchAllTermsUsers(termId)
                        .then(termsUsers => {
                            setTermInfo(termInfoResult)
                            setSignedUsersTotal(termsUsers.total)

                            isLoadingTermRef.current = false
                            setIsLoadingTerm(isLoadingTermRef.current)
                        })
                        .catch(e => {
                            setTermInfo(termInfoResult)
                            isLoadingTermRef.current = false
                            setIsLoadingTerm(isLoadingTermRef.current)
                            handleError(e)
                        })
                })
                .catch(e => {
                    isLoadingTermRef.current = false
                    setIsLoadingTerm(isLoadingTermRef.current)
                    handleError(e)
                })
        }
    }, [termId])

    /**
     * Add new term
     */
    const doAddTerm = useCallback(
        (data: Partial<FormAddTerm>, callBack: () => void) => {
            setIsAdding(true)
            createTerm(data)
                .then(() => {
                    toast.success('Term added successfully', {
                        toastId: 'Add term',
                    })
                    setIsAdding(false)
                    callBack()
                })
                .catch(e => {
                    setIsAdding(false)
                    handleError(e)
                })
        },
        [setIsAdding],
    )

    /**
     * Update term
     */
    const doUpdateTerm = useCallback(
        (data: Partial<FormAddTerm>, callBack: () => void) => {
            setIsAdding(true)
            editTerm(termId ?? '', data)
                .then(() => {
                    toast.success('Term updated successfully', {
                        toastId: 'Update term',
                    })
                    setIsAdding(false)
                    callBack()
                })
                .catch(e => {
                    setIsAdding(false)
                    handleError(e)
                })
        },
        [setIsAdding, termId],
    )

    /**
     * Remove term
     */
    const doRemoveTerm = useCallback(
        (callBack: () => void) => {
            setIsRemoving(true)
            removeTerm(termId ?? '')
                .then(() => {
                    toast.success('Term removed successfully', {
                        toastId: 'Remove term',
                    })
                    setIsRemoving(false)
                    callBack()
                })
                .catch(e => {
                    setIsRemoving(false)
                    handleError(e)
                })
        },
        [termId],
    )

    /**
     * Fetch term info on init
     */
    useEffect(() => {
        doFetchTerm()
    }, [doFetchTerm])

    return {
        doAddTerm,
        doRemoveTerm,
        doUpdateTerm,
        isAdding,
        isFetchingTermsAgreeabilityTypes,
        isFetchingTermsTypes,
        isLoading: isLoadingTerm || isAdding || isRemoving,
        isLoadingTerm,
        isRemoving,
        signedUsersTotal,
        termInfo,
        termsAgreeabilityTypes,
        termsTypes,
    }
}
