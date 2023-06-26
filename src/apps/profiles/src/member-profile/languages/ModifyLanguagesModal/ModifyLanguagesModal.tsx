import { sortBy, trim } from 'lodash'
import { Dispatch, FC, MutableRefObject, SetStateAction, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'

import { BaseModal, Button, IconOutline, InputSelect, InputText } from '~/libs/ui'
import { UserProfile } from '~/libs/core'

import dropDowns from './dropdowns.json'
import styles from './ModifyLanguagesModal.module.scss'

interface ModifyLanguagesModalProps {
    onClose: () => void
    onSave: () => void
    profile: UserProfile
}

const ModifyLanguagesModal: FC<ModifyLanguagesModalProps> = (props: ModifyLanguagesModalProps) => {
    const formElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const [isSaving, setIsSaving]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isFormChanged, setIsFormChanged]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [isEditMode, setIsEditMode]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const [formErrors, setFormErrors]: [
        { [key: string]: string },
        Dispatch<SetStateAction<{ [key: string]: string }>>
    ]
        = useState<{ [key: string]: string }>({})

    const [selectedLanguage, setSelectedLanguage]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ]
        = useState<string | undefined>()

    const languages: any = useMemo(() => sortBy(
        dropDowns.language.map(lang => ({ label: lang.label, value: lang.label })),
        'label',
    ), [])

    function handleSelectedLanguageChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setSelectedLanguage(event.target.value)
        setIsFormChanged(true)
    }

    function handleLanguagesSave(): void {
        props.onClose()
    }

    function handleFormAction(): void {
    }

    function handleCancelEditMode(): void {
        setIsEditMode(false)
        resetForm()
        setFormErrors({})
    }

    function resetForm(): void {
        formElRef.current.reset()
        setIsEditMode(false)
    }

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title='My Languages'
            buttons={(
                <div className={styles.modalButtons}>
                    <Button
                        label='Cancel'
                        onClick={props.onClose}
                        secondary
                    />
                    <Button
                        label='Save'
                        onClick={handleLanguagesSave}
                        primary
                        disabled={isSaving || !isFormChanged}
                    />
                </div>
            )}
        >
            <div className={styles.container}>
                <form
                    ref={formElRef}
                    className={classNames(styles.formWrap)}
                >
                    <div className={styles.form}>
                        <InputSelect
                            options={languages}
                            value={selectedLanguage}
                            onChange={handleSelectedLanguageChange}
                            name='languages'
                            label='Language *'
                            error={formErrors.selectedLanguage}
                            placeholder='Select a Language'
                            dirty
                        />

                        <div className={styles.formCTAs}>
                            {!isEditMode && <IconOutline.PlusCircleIcon />}
                            <Button
                                link
                                label={`${isEditMode ? 'Edit' : 'Add'} Language to your List`}
                                onClick={handleFormAction}
                            />
                            {isEditMode && (
                                <Button
                                    className={styles.ctaBtnCancel}
                                    link
                                    label='Cancel'
                                    onClick={handleCancelEditMode}
                                />
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </BaseModal>
    )
}

export default ModifyLanguagesModal
