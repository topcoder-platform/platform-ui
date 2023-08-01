import { FC, useState } from 'react'

import { Button, IconOutline } from '~/libs/ui'
import { UserTrait } from '~/libs/core'

import { renderLinkIcon } from '../../MemberLinks'
import { LinkForm, UserLink } from '../LinkForm'

import styles from './LinkEntry.module.scss'

interface LinkEntryProps {
    index: number
    link: UserTrait
    onSave: (link: UserTrait, index: number) => Promise<UserTrait | undefined>
    onRemove: (link: UserTrait) => void
}

const LinkEntry: FC<LinkEntryProps> = props => {
    const [isEditing, setIsEditing] = useState(!(props.link.name || props.link.url))
    const isNew = !props.link.name && !props.link.url

    function handleReomveClick(): void {
        props.onRemove(props.link)
    }

    async function handleOnSave(link: UserLink): Promise<void> {
        if (!await props.onSave(link, props.index)) {
            return
        }

        setIsEditing(false)
    }

    function toggleIsEditing(): void {
        setIsEditing(editMode => !editMode)
    }

    return !isEditing ? (
        <div className={styles.linkItemWrap} key={`member-link-${props.link.name}`}>
            {renderLinkIcon(props.link.name)}
            <div className={styles.linkItem}>
                <div className={styles.linkLabelWrap}>
                    <small>{props.link.name}</small>
                    <p>{props.link.url}</p>
                </div>
                <div>
                    <Button
                        className={styles.button}
                        size='lg'
                        icon={IconOutline.PencilIcon}
                        onClick={toggleIsEditing}
                    />
                    <Button
                        className={styles.button}
                        size='lg'
                        icon={IconOutline.TrashIcon}
                        onClick={handleReomveClick}
                    />
                </div>
            </div>
        </div>
    ) : (
        <LinkForm
            link={props.link as UserLink}
            onSave={handleOnSave}
            onDiscard={toggleIsEditing}
            isNew={isNew}
        />
    )
}

export default LinkEntry
