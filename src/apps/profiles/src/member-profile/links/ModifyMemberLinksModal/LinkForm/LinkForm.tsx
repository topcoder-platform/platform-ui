import { trim } from 'lodash'
import { FC, useEffect, useState } from 'react'
import classNames from 'classnames'

import { Button, IconOutline, InputSelect, InputText } from '~/libs/ui'

import { linkTypes } from '../link-types.config'
import { isValidURL } from '../../../../lib'

import styles from './LinkForm.module.scss'

export interface UserLink {
    name: string
    url: string
}

interface LinkFormProps {
    isNew: boolean
    link?: UserLink
    onSave: (link: UserLink) => void
    onDiscard: () => void
}

const LinkForm: FC<LinkFormProps> = props => {
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
    const [selectedLinkType, setSelectedLinkType] = useState<string | undefined>()
    const [selectedLinkURL, setSelectedLinkURL] = useState<string | undefined>()

    function handleSelectedLinkTypeChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedLinkType(event.target.value)
    }

    function handleURLChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedLinkURL(event.target.value)
    }

    function handleFormAction(): void {
        setFormErrors({})

        if (!selectedLinkType) {
            setFormErrors({ selectedLinkType: 'Please select a link type' })
            return
        }

        if (!trim(selectedLinkURL)) {
            setFormErrors({ url: 'Please enter a URL' })
            return
        }

        if (!isValidURL(selectedLinkURL as string)) {
            setFormErrors({ url: 'Invalid URL' })
            return
        }

        props.onSave({
            name: selectedLinkType,
            url: trim(selectedLinkURL) || '',
        })
    }

    function handleDiscardClick(): void {
        setFormErrors({})
        props.onDiscard()

        if (!props.link) {
            return
        }

        if (selectedLinkType !== props.link.name) {
            setSelectedLinkType(props.link.name)
        }

        if (selectedLinkURL !== props.link.url) {
            setSelectedLinkURL(props.link.url)
        }
    }

    useEffect(() => {
        if (!props.link) {
            return
        }

        if (selectedLinkType !== props.link.name) {
            setSelectedLinkType(props.link.name)
        }

        if (selectedLinkURL !== props.link.url) {
            setSelectedLinkURL(props.link.url)
        }

    }, [props.link?.name, props.link?.url])

    return (
        <form className={classNames(styles.formWrap)}>
            <div className={styles.form}>
                <InputSelect
                    options={linkTypes}
                    value={selectedLinkType}
                    onChange={handleSelectedLinkTypeChange}
                    name='linkType'
                    label='Type'
                    error={formErrors.selectedLinkType}
                    placeholder='Select a link type'
                    dirty
                />

                <InputText
                    name='url'
                    label='URL'
                    error={formErrors.url}
                    placeholder='Enter a URL'
                    dirty
                    tabIndex={-1}
                    type='text'
                    onChange={handleURLChange}
                    value={selectedLinkURL}
                    autoFocus
                />
                <Button
                    className={styles.button}
                    size='lg'
                    icon={IconOutline.CheckIcon}
                    onClick={handleFormAction}
                />
                {!props.isNew && (
                    <Button
                        className={styles.button}
                        size='lg'
                        icon={IconOutline.XIcon}
                        onClick={handleDiscardClick}
                    />
                )}
            </div>
        </form>
    )
}

export default LinkForm
