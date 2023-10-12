import { trim } from 'lodash'
import {
    FC,
    forwardRef,
    ForwardRefExoticComponent,
    SVGProps,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react'
import classNames from 'classnames'

import { Button, IconOutline, InputSelect, InputText } from '~/libs/ui'

import { additionalLinkTypes } from '../link-types.config'
import { isValidURL } from '../../../../lib'
import { renderLinkIcon } from '../../MemberLinks'

import styles from './LinkForm.module.scss'

export interface UserLink {
    name: string
    url: string
}

interface LinkFormProps {
    link?: UserLink
    allowEditType?: boolean
    classNames?: string
    placeholder?: string
    onSave: (link: UserLink) => void
    onRemove?: () => void
    removeIcon?: FC<SVGProps<SVGSVGElement>>
    hideRemoveIcon?: boolean
    allowEmptyUrl?: boolean
    labelUrlField?: string
    disabled?: boolean
}

export type LinkFormHandle = {
    validateForm: () => void;
    resetForm: () => void;
};

const LinkForm: ForwardRefExoticComponent<
    LinkFormProps & React.RefAttributes<LinkFormHandle>
> = forwardRef<LinkFormHandle, LinkFormProps>((props, ref) => {
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
    const [selectedLinkType, setSelectedLinkType] = useState<string | undefined>()
    const [selectedLinkURL, setSelectedLinkURL] = useState<string | undefined>()
    const [shouldValidateForm, setShouldValidateForm] = useState<boolean>(false)
    const canShowTypeError = useRef(false)
    const canShowUrlError = useRef(false)

    useEffect(() => {
        if (shouldValidateForm) {
            handleFormAction()
        }
    }, [selectedLinkType, selectedLinkURL, shouldValidateForm])

    useImperativeHandle(ref, () => ({
        resetForm() {
            setShouldValidateForm(false)
            setFormErrors({})
            canShowTypeError.current = false
            canShowUrlError.current = false
        },
        validateForm() {
            canShowTypeError.current = true
            canShowUrlError.current = true
            handleFormAction()
        },
    }))

    function handleSelectedLinkTypeChange(event: React.ChangeEvent<HTMLInputElement>): void {
        canShowTypeError.current = true
        setSelectedLinkType(event.target.value)
        setShouldValidateForm(true)
    }

    function handleURLChange(event: React.ChangeEvent<HTMLInputElement>): void {
        canShowUrlError.current = true
        setSelectedLinkURL(event.target.value)
        setShouldValidateForm(true)
    }

    function getFormError(): boolean {
        setFormErrors({})

        let isError = false
        if (!selectedLinkType) {
            isError = true
            if (canShowTypeError.current) {
                setFormErrors({ selectedLinkType: 'Please select a link type' })
            }
        }

        if (!props.allowEmptyUrl && !trim(selectedLinkURL)) {
            isError = true
            if (canShowUrlError.current) {
                setFormErrors({ url: 'Please enter a URL' })
            }
        }

        if (selectedLinkURL && !isValidURL(selectedLinkURL as string)) {
            isError = true
            if (canShowUrlError.current) {
                setFormErrors({ url: 'Invalid URL' })
            }
        }

        return isError
    }

    function handleFormAction(): void {
        if (getFormError()) {
            return
        }

        let absoluteURL = trim(selectedLinkURL) || ''

        if (absoluteURL.indexOf('://') > 0 || absoluteURL.indexOf('//') === 0) {

            props.onSave({
                name: selectedLinkType ?? '',
                url: absoluteURL,
            })
        } else {
            absoluteURL = absoluteURL ? `https://${absoluteURL}` : ''

            props.onSave({
                name: selectedLinkType ?? '',
                url: absoluteURL,
            })
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
        <form className={classNames(classNames(styles.formWrap, props.classNames))}>
            <div className={styles.form}>
                {props.allowEditType ? (
                    <InputSelect
                        options={additionalLinkTypes}
                        value={selectedLinkType}
                        onChange={handleSelectedLinkTypeChange}
                        name='linkType'
                        label='Type'
                        error={formErrors.selectedLinkType}
                        placeholder='Select a link type'
                        dirty
                        disabled={props.disabled}
                    />
                ) : (
                    renderLinkIcon(selectedLinkType || '')
                )}

                <InputText
                    name='url'
                    label={props.labelUrlField || 'URL'}
                    error={formErrors.url}
                    placeholder={props.placeholder ?? 'Enter a URL'}
                    dirty
                    tabIndex={0}
                    type='text'
                    onChange={handleURLChange}
                    value={selectedLinkURL || ''}
                    forceUpdateValue
                    disabled={props.disabled}
                />
                {props.onRemove && !props.hideRemoveIcon && (
                    <Button
                        className={styles.button}
                        size='lg'
                        icon={props.removeIcon ?? IconOutline.TrashIcon}
                        onClick={props.onRemove}
                    />
                )}
            </div>
        </form>
    )
})

export default LinkForm
