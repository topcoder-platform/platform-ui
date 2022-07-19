import classNames from 'classnames'
import {
    ChangeEvent,
    createRef,
    Dispatch,
    FocusEvent,
    FormEvent,
    RefObject,
    SetStateAction,
    useEffect,
    useState,
} from 'react'

import { Button } from '../button'
import '../styles/index.scss'
import { IconOutline } from '../svgs'

import { FormButton, FormDefinition, FormInputModel } from '.'
import {
    formGetInputFields,
    formInitializeValues,
    formOnBlur,
    formOnChange,
    formOnReset,
    formOnSubmitAsync,
} from './form-functions'
import { validateForm } from './form-functions/form.functions'
import { FormGroups } from './form-groups'
import styles from './Form.module.scss'

interface FormProps<ValueType, RequestType> {
    readonly formDef: FormDefinition
    readonly formValues?: ValueType
    readonly onChange?: (inputs: ReadonlyArray<FormInputModel>) => void,
    readonly onSuccess?: () => void
    readonly requestGenerator: (inputs: ReadonlyArray<FormInputModel>) => RequestType
    readonly save: (value: RequestType) => Promise<void>
}

const Form: <ValueType extends any, RequestType extends any>(props: FormProps<ValueType, RequestType>) => JSX.Element
    = <ValueType extends any, RequestType extends any>(props: FormProps<ValueType, RequestType>) => {

        const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
            = useState<FormDefinition>({ ...props.formDef })

        const [formError, setFormError]: [string | undefined, Dispatch<SetStateAction<string | undefined>>]
            = useState<string | undefined>()

        const [formKey, setFormKey]: [number, Dispatch<SetStateAction<number>>]
            = useState<number>(Date.now())

        const [formRef]: [RefObject<HTMLFormElement>, Dispatch<SetStateAction<RefObject<HTMLFormElement>>>]
            = useState<RefObject<HTMLFormElement>>(createRef<HTMLFormElement>())

        // This will hold all the inputs
        const [inputs, setInputs]: [Array<FormInputModel>, Dispatch<SetStateAction<Array<FormInputModel>>>] = useState<Array<FormInputModel>>(formGetInputFields(formDef.groups || []))
        const [isFormInvalid, setFormInvalid]: [boolean, Dispatch<boolean>] = useState<boolean>(inputs.filter(item => !!item.error).length > 0)

        useEffect(() => {
            if (!formRef.current?.elements) {
                return
            }
            validateForm(formRef.current?.elements, 'initial', inputs)
            checkIfFormIsValid(inputs)
        }, [])

        function checkIfFormIsValid(formInputFields: Array<FormInputModel>): void {
            setFormInvalid(formInputFields.filter(item => !!item.error).length > 0)
        }

        function onBlur(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>): void {
            formOnBlur(event, inputs, props.formValues)
            setFormDef({ ...formDef })
            const formInputFields: Array<FormInputModel> = formGetInputFields(formDef.groups || [])
            setInputs(formInputFields)
            checkIfFormIsValid(formInputFields)
        }

        function onChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
            if (props.onChange) {
                props.onChange(inputs)
            }
            formOnChange(event, inputs, props.formValues)
            const formInputFields: Array<FormInputModel> = formGetInputFields(formDef.groups || [])
            setInputs(formInputFields)
            setFormDef({ ...formDef })
            checkIfFormIsValid(formInputFields)
        }

        function onReset(): void {
            formOnReset(inputs, props.formValues)
            setFormDef({ ...formDef })
            setInputs(formGetInputFields(formDef.groups || []))
            setFormKey(Date.now())
        }

        async function onSubmitAsync(event: FormEvent<HTMLFormElement>): Promise<void> {
            const values: RequestType = props.requestGenerator(inputs)
            formOnSubmitAsync<RequestType>(event, formDef, values, props.save, props.onSuccess)
                .then(() => {
                    setFormKey(Date.now())
                    formOnReset(inputs, props.formValues)
                    setFormDef({ ...formDef })
                    setInputs(formGetInputFields(formDef.groups || []))
                })
                .catch((error: string | undefined) => {
                    setFormError(error)
                    setFormDef({ ...formDef })
                    setInputs(formGetInputFields(formDef.groups || []))
                })
        }

        formInitializeValues(inputs, props.formValues)

        const createButtonGroup: (groups: ReadonlyArray<FormButton>, isPrimaryGroup: boolean) => Array<JSX.Element> = (groups, isPrimaryGroup) => {
            return groups.map((button, index) => {
                // if this is a reset button, set its onclick to reset
                if (!!button.isReset) {
                    button = {
                        ...button,
                        onClick: onReset,
                    }
                }

                return (
                    <Button
                        {...button}
                        key={button.label}
                        disable={isPrimaryGroup && isFormInvalid}
                        tabIndex={button.notTabble ? -1 : index + (inputs ? inputs.length : 0) + (formDef.tabIndexStart || 0)}
                    />
                )
            })
        }

        const secondaryGroupButtons: Array<JSX.Element> = createButtonGroup(formDef.buttons.secondaryGroup || [], false)

        const primaryGroupButtons: Array<JSX.Element> = createButtonGroup(formDef.buttons.primaryGroup, true)

        // set the max width of the form error so that it doesn't push the width of the form wider
        const errorsRef: RefObject<HTMLDivElement> = createRef<HTMLDivElement>()
        useEffect(() => {
            const formWidth: number = formRef.current?.clientWidth || 0

            // errorsRef current will always exist,
            // but need to to satisfy typescript and check
            if (!!errorsRef.current) {
                errorsRef.current.style.maxWidth = `${formWidth}px`
            }
        }, [formRef])

        return (
            <form
                action={''}
                className={styles.form}
                key={formKey}
                onSubmit={onSubmitAsync}
                ref={formRef}
            >

                {!!props.formDef.title && (
                    <h2>{props.formDef.title}</h2>
                )}

                {!!props.formDef.subtitle && (
                    <div className={classNames('large-subtitle', styles.subtitle)}>
                        {props.formDef.subtitle}
                    </div>
                )}

                <FormGroups
                    inputs={inputs}
                    formDef={formDef}
                    onBlur={onBlur}
                    onChange={onChange}
                />

                <div className={classNames(styles['form-footer'], 'form-footer')}>
                    {!!formError && (
                        <div
                            className={styles['form-error']}
                            ref={errorsRef}
                        >
                            <IconOutline.InformationCircleIcon />
                            {formError}
                        </div>
                    )}
                    <div className={styles['button-container']}>
                        <div className={styles['left-container']}>
                            {secondaryGroupButtons}
                        </div>
                        <div className={styles['right-container']}>
                            {primaryGroupButtons}
                        </div>
                    </div>
                </div>

            </form>
        )
    }

export default Form
