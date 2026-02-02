import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import classNames from 'classnames'

import { UserProfile } from '~/libs/core'

import { EditMemberPropertyBtn } from '../../../components'
import { OpenForGigsModifyModal } from '../OpenForGigsModifyModal'
import { EDIT_MODE_QUERY_PARAM, profileEditModes } from '../../../config'

import styles from './OpenForGigs.module.scss'

interface OpenForGigsProps {
    canEdit: boolean
    authProfile: UserProfile | undefined
    profile: UserProfile
    refreshProfile: (handle: string) => void
    isPrivilegedViewer?: boolean
}

const OpenForGigs: FC<OpenForGigsProps> = (props: OpenForGigsProps) => {
    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const editMode: string | null = queryParams.get(EDIT_MODE_QUERY_PARAM)

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const openForWork = props.profile.availableForGigs

    useEffect(() => {
        if (props.authProfile && editMode === profileEditModes.openForWork) {
            setIsEditMode(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.authProfile])

    function handleModifyOpenForWorkClick(): void {
        setIsEditMode(true)
    }

    function handleModifyOpenForWorkClose(): void {
        setIsEditMode(false)
    }

    function handleModifyOpenForWorkSave(): void {
        setTimeout(() => {
            setIsEditMode(false)
            props.refreshProfile(props.profile.handle)
        }, 1000)
    }

    return props.canEdit || openForWork || props.isPrivilegedViewer ? (
        <div className={styles.container}>
            <p className={classNames('body-main-bold', !openForWork ? styles.notOopenToWork : '')}>
                {openForWork ? 'open to work' : 'not open to work'}
            </p>
            {
                props.canEdit && (
                    <EditMemberPropertyBtn
                        onClick={handleModifyOpenForWorkClick}
                    />
                )
            }
            {
                isEditMode && (
                    <OpenForGigsModifyModal
                        onClose={handleModifyOpenForWorkClose}
                        onSave={handleModifyOpenForWorkSave}
                        profile={props.profile}
                    />
                )
            }
        </div>
    ) : <></>
}

export default OpenForGigs
