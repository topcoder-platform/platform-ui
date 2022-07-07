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

import { Element, FormDefinition } from './form-definition.model'
import { NonStaticField } from './form-field.model'
import {
    formInitializeValues,
    formOnBlur,
    formOnChange,
    formOnReset,
    formOnSubmitAsync,
} from './form-functions'
import { getFormInputFields, getNonStaticInputFields, isNonStaticField } from './form-functions/form.functions'
import { FormInputs } from './form-inputs'
import styles from './Form.module.scss'

interface FormProps<ValueType, RequestType> {
    readonly formDef: FormDefinition
    readonly formValues?: ValueType
    readonly onSuccess?: () => void
    readonly requestGenerator: (inputs: ReadonlyArray<NonStaticField>) => RequestType
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

        // This will hold all the inputs that are not static fields
        const [inputs, setInputs]: [Array<NonStaticField>, Dispatch<SetStateAction<Array<NonStaticField>>>] = useState<Array<NonStaticField>>(getNonStaticInputFields(formDef.elements))

        function onBlur(event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>): void {
            formOnBlur(event, inputs, props.formValues)
            setFormDef({ ...formDef })
            setInputs(getNonStaticInputFields(formDef.elements))
        }

        function onChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
            formOnChange(event, inputs, props.formValues)
            setInputs(getNonStaticInputFields(formDef.elements))
            setFormDef({ ...formDef })
        }

        function onReset(): void {
            formOnReset(inputs, props.formValues)
            setFormDef({ ...formDef })
            setInputs(getNonStaticInputFields(formDef.elements))
            setFormKey(Date.now())
        }

        async function onSubmitAsync(event: FormEvent<HTMLFormElement>): Promise<void> {
            const values: RequestType = props.requestGenerator(inputs)
            formOnSubmitAsync<RequestType>(event, formDef, values, props.save, props.onSuccess)
                .then(() => {
                    setFormKey(Date.now())
                    formOnReset(inputs, props.formValues)
                    setFormDef({ ...formDef })
                    setInputs(getNonStaticInputFields(formDef.elements))
                })
                .catch((error: string | undefined) => {
                    setFormError(error)
                    setFormDef({ ...formDef })
                    setInputs(getNonStaticInputFields(formDef.elements))
                })
        }

        formInitializeValues(inputs, props.formValues)

        const leftButtons: Array<JSX.Element> = formDef.leftButtons ? formDef.leftButtons
            .map((button, index) => {
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
                        tabIndex={button.notTabble ? -1 : index + (inputs ? inputs.length : 0) + (formDef.tabIndexStart || 0)}
                    />
                )
            }) : []

        const rightButtons: Array<JSX.Element> = formDef.rightButtons ? formDef.rightButtons
            .map((button, index) => {
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
                        tabIndex={button.notTabble ? -1 : index + (inputs ? inputs.length : 0) + (formDef.tabIndexStart || 0)}
                    />
                )
            }) : []

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

                <FormInputs
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
                            {leftButtons}
                        </div>
                        <div className={styles['right-container']}>
                            {rightButtons}
                        </div>
                    </div>
                </div>

            </form>
        )
    }

export default Form
