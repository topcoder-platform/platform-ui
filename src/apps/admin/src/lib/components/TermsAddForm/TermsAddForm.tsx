/**
 * Terms Add Form.
 */
import {
    Dispatch,
    FC,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { NavigateFunction, useNavigate, useParams } from 'react-router-dom'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import {
    Button,
    ConfirmModal,
    InputSelectReact,
    InputText,
    InputTextarea,
    LinkButton,
} from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'
import { EnvironmentConfig } from '~/config'

import { FormAddWrapper } from '../common/FormAddWrapper'
import { FormAddTerm } from '../../models'
import { formAddTermSchema } from '../../utils'
import { useManageAddTerm, useManageAddTermProps } from '../../hooks'
import { FieldHtmlEditor } from '../common/FieldHtmlEditor'

import styles from './TermsAddForm.module.scss'

interface Props {
    className?: string
}

const electronicallyAgreeableId = EnvironmentConfig.ADMIN.AGREE_ELECTRONICALLY
const docusignTypeId = EnvironmentConfig.ADMIN.AGREE_FOR_DOCUSIGN_TEMPLATE

export const TermsAddForm: FC<Props> = (props: Props) => {
    const [removeConfirmationOpen, setRemoveConfirmationOpen]: [
        boolean,
        Dispatch<SetStateAction<boolean>>,
    ] = useState<boolean>(false)
    const navigate: NavigateFunction = useNavigate()
    const [showEditor, setShowEditor] = useState(false)
    const { id = '' }: { id?: string } = useParams<{
        id?: string
    }>()
    const [hideField, setHideField] = useState<{ [key: string]: boolean }>({
        docusignTemplateId: true,
        url: true,
    })

    const {
        isFetchingTermsTypes,
        isFetchingTermsAgreeabilityTypes,
        isLoading,
        isRemoving,
        doAddTerm,
        doRemoveTerm,
        doUpdateTerm,
        signedUsersTotal,
        termsTypes,
        termsAgreeabilityTypes,
        termInfo,
    }: useManageAddTermProps = useManageAddTerm(id)

    const termsTypesOptions = useMemo(
        () => termsTypes.map(item => ({
            label: item.name,
            value: `${item.id}`,
        })),
        [termsTypes],
    )
    const termsAgreeabilityTypesOptions = useMemo(
        () => termsAgreeabilityTypes.map(item => ({
            label: item.name,
            value: item.id,
        })),
        [termsAgreeabilityTypes],
    )
    const isEdit = !!id
    const {
        register,
        handleSubmit,
        control,
        reset,
        getValues,
        setValue,
        watch,
        formState: { errors, isDirty },
    }: UseFormReturn<FormAddTerm> = useForm({
        defaultValues: {
            agreeabilityTypeId: '',
            docusignTemplateId: '',
            text: '',
            title: '',
            typeId: '',
            url: '',
        },
        mode: 'all',
        resolver: yupResolver(formAddTermSchema),
    })

    /**
     * Handle submit form event
     */
    const onSubmit = useCallback(
        (data: FormAddTerm) => {
            const requestBody = _.pickBy(data, _.identity)
            if (isEdit) {
                doUpdateTerm(requestBody, () => {
                    navigate('./../..')
                })
            } else {
                doAddTerm(requestBody, () => {
                    navigate('./..')
                })
            }
        },
        [isEdit, navigate],
    )

    const agreeabilityTypeId = watch('agreeabilityTypeId')
    useEffect(() => {
        // check to enable/disable 'Docusign Template ID' and 'URL' fields
        if (agreeabilityTypeId) {
            const isDocuSignFieldEnabled = agreeabilityTypeId === docusignTypeId
            const isUrlEnabled
                = agreeabilityTypeId === electronicallyAgreeableId
            if (!isDocuSignFieldEnabled) {
                const docusignTemplateId = getValues('docusignTemplateId')
                if (docusignTemplateId) {
                    setValue('docusignTemplateId', '')
                }
            }

            if (!isUrlEnabled) {
                const url = getValues('url')
                if (url) {
                    setValue('url', '')
                }
            }

            setHideField({
                docusignTemplateId: !isDocuSignFieldEnabled,
                url: !isUrlEnabled,
            })
        }
    }, [agreeabilityTypeId])

    useEffect(() => {
        if (termInfo) {
            reset({
                agreeabilityTypeId: termInfo.agreeabilityTypeId,
                docusignTemplateId: termInfo.docusignTemplateId ?? '',
                text: termInfo.text ?? '',
                title: termInfo.title,
                typeId: `${termInfo.typeId}`,
                url: termInfo.url ?? '',
            })
        }
    }, [termInfo])

    return (
        <FormAddWrapper
            className={classNames(styles.container, props.className)}
            isAdding={isLoading}
            onSubmit={handleSubmit(onSubmit)}
            actions={(
                <>
                    {isEdit && (
                        <div className={styles.btnDelete}>
                            <Button
                                disabled={signedUsersTotal !== 0 || isLoading}
                                primary
                                size='lg'
                                variant='danger'
                                onClick={function onClick() {
                                    setRemoveConfirmationOpen(true)
                                }}
                            >
                                Delete
                            </Button>
                            {signedUsersTotal > 0 && (
                                <strong>
                                    {signedUsersTotal}
                                    {' '}
                                    {signedUsersTotal > 1 ? 'Users' : 'User'}
                                    {' '}
                                    have Signed
                                </strong>
                            )}
                        </div>
                    )}
                    <Button
                        disabled={!isDirty || isLoading}
                        primary
                        size='lg'
                        type='submit'
                    >
                        Save Changes
                    </Button>
                    <LinkButton
                        secondary
                        to={isEdit ? './../..' : './..'}
                        size='lg'
                    >
                        Cancel
                    </LinkButton>
                </>
            )}
        >
            <InputText
                type='text'
                name='title'
                label='Title'
                placeholder='Enter'
                tabIndex={0}
                forceUpdateValue
                onChange={_.noop}
                error={_.get(errors, 'title.message')}
                inputControl={register('title')}
                dirty
                disabled={isLoading}
                classNameWrapper={styles.fieldTitle}
            />
            <Controller
                name='typeId'
                control={control}
                render={function render(controlProps: {
                    field: ControllerRenderProps<FormAddTerm, 'typeId'>
                }) {
                    return (
                        <InputSelectReact
                            name='typeId'
                            label='Type'
                            placeholder='Select'
                            options={termsTypesOptions}
                            value={controlProps.field.value}
                            onChange={controlProps.field.onChange}
                            onBlur={controlProps.field.onBlur}
                            classNameWrapper={styles.inputField}
                            disabled={isLoading}
                            isLoading={isFetchingTermsTypes}
                            dirty
                            error={_.get(errors, 'typeId.message')}
                        />
                    )
                }}
            />
            <Controller
                name='agreeabilityTypeId'
                control={control}
                render={function render(controlProps: {
                    field: ControllerRenderProps<
                        FormAddTerm,
                        'agreeabilityTypeId'
                    >
                }) {
                    return (
                        <InputSelectReact
                            name='agreeabilityTypeId'
                            label='Agreeability Type'
                            placeholder='Select'
                            options={termsAgreeabilityTypesOptions}
                            value={controlProps.field.value}
                            onChange={controlProps.field.onChange}
                            onBlur={controlProps.field.onBlur}
                            classNameWrapper={styles.inputField}
                            disabled={isLoading}
                            isLoading={isFetchingTermsAgreeabilityTypes}
                            dirty
                            error={_.get(errors, 'agreeabilityTypeId.message')}
                        />
                    )
                }}
            />
            {agreeabilityTypeId && !hideField.docusignTemplateId && (
                <InputText
                    type='text'
                    name='docusignTemplateId'
                    label='Docusign Template ID'
                    placeholder='Enter'
                    tabIndex={0}
                    forceUpdateValue
                    onChange={_.noop}
                    error={_.get(errors, 'docusignTemplateId.message')}
                    inputControl={register('docusignTemplateId')}
                    dirty
                    disabled={isLoading}
                />
            )}
            {agreeabilityTypeId && !hideField.url && (
                <InputText
                    type='text'
                    name='url'
                    label='URL'
                    placeholder='Enter'
                    tabIndex={0}
                    forceUpdateValue
                    onChange={_.noop}
                    error={_.get(errors, 'url.message')}
                    inputControl={register('url')}
                    dirty
                    disabled={isLoading}
                />
            )}

            <div className={styles.fieldTextContainer}>
                <Button
                    primary
                    onClick={function onClick() {
                        setShowEditor(prev => !prev)
                    }}
                >
                    {showEditor ? 'Hide' : 'Show'}
                    {' '}
                    HTML Editor
                </Button>
                {showEditor ? (
                    <Controller
                        name='text'
                        control={control}
                        render={function render(controlProps: {
                            field: ControllerRenderProps<FormAddTerm, 'text'>
                        }) {
                            return (
                                <FieldHtmlEditor
                                    name='text'
                                    label='Text'
                                    placeholder='Enter'
                                    tabIndex={0}
                                    value={controlProps.field.value}
                                    onChange={function onChange(value: string) {
                                        controlProps.field.onChange(value)
                                    }}
                                    onBlur={controlProps.field.onBlur}
                                    error={_.get(errors, 'text.message')}
                                    dirty
                                    disabled={isLoading}
                                    classNameWrapper={styles.fieldText}
                                />
                            )
                        }}
                    />
                ) : (
                    <InputTextarea
                        name='text'
                        label='Text'
                        placeholder='Enter'
                        tabIndex={0}
                        onChange={_.noop}
                        error={_.get(errors, 'text.message')}
                        inputControl={register('text')}
                        dirty
                        disabled={isLoading}
                        classNameWrapper={classNames(
                            styles.fieldText,
                            styles.fieldAreaContainer,
                        )}
                    />
                )}
            </div>

            <ConfirmModal
                title='Delete Confirmation'
                action='delete'
                isLoading={isRemoving}
                onClose={function onClose() {
                    setRemoveConfirmationOpen(false)
                }}
                onConfirm={function onConfirm() {
                    doRemoveTerm(() => {
                        navigate('./../..')
                    })
                }}
                open={removeConfirmationOpen}
            >
                <div>Are you sure want to delete this terms of use?</div>
            </ConfirmModal>
        </FormAddWrapper>
    )
}

export default TermsAddForm
