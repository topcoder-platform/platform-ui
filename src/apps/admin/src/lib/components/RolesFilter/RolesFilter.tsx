/**
 * Roles filter ui.
 */
import {
    FC,
    FocusEvent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import { Button } from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { FieldSingleSelect } from '../FieldSingleSelect'
import {
    FormRolesFilter,
    SelectOption,
    TableRolesFilter,
    UserRole,
} from '../../models'
import { formRolesFilterSchema } from '../../utils'

import styles from './RolesFilter.module.scss'

interface Props {
    className?: string
    isLoading?: boolean
    isAdding?: boolean
    setFilters: (filterDatas: TableRolesFilter) => void
    doAddRole: (roleName: string, success: () => void) => void
    roles: UserRole[]
}

export const RolesFilter: FC<Props> = props => {
    const [searchKey, setSearchKey] = useState('')
    const [newOption, setNewOption] = useState<SelectOption>()
    const {
        watch,
        reset,
        control,
        setValue,
    }: UseFormReturn<FormRolesFilter> = useForm({
        defaultValues: {
            // eslint-disable-next-line unicorn/no-null
            roleName: null, // the react-select only accept null in this case
        },
        mode: 'all',
        resolver: yupResolver(formRolesFilterSchema),
    })

    const roleName = watch('roleName')
    const createRoleName = useMemo(() => (
        searchKey || (newOption?.label as string) || roleName?.label || ''
    ), [searchKey, newOption, roleName])
    const isValid = useMemo(
        () => !_.find(props.roles, { roleName: createRoleName }),
        [props.roles, createRoleName],
    )
    const resetAllValue = useCallback(() => {
        reset({
            // eslint-disable-next-line unicorn/no-null
            roleName: null, // the react-select only accept null in this case
        })
        setNewOption(undefined)
        setSearchKey('')
    }, [])

    const onSubmit = useCallback(
        (value: string) => {
            setNewOption({
                label: value,
                value,
            })
            setValue('roleName', {
                label: value,
                value,
            })
            props.doAddRole(value, () => {
                resetAllValue()
            })
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.doAddRole, createRoleName],
    )

    useEffect(() => {
        props.setFilters({
            roleName: createRoleName,
        })
    }, [createRoleName]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <form
            className={classNames(styles.container, props.className)}
            // Add this to prevent the unexpected action
            // We only need to trigger submit when the submit button is clicked,
            // and this is already handled by the onClick event of the submit button
            onSubmit={_.noop}
        >
            <div className={styles.fields}>
                <Controller
                    name='roleName'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormRolesFilter,
                            'roleName'
                        >
                    }) {
                        return (
                            <FieldSingleSelect
                                options={[
                                    ...props.roles.map(role => ({
                                        label: role.roleName,
                                        value: role.id,
                                    })),
                                    ...(newOption ? [newOption] : []),
                                ]}
                                label='Search/create role'
                                placeholder='Select'
                                value={controlProps.field.value}
                                onChange={function onChange(newValue: SelectOption) {
                                    if (newValue.label === newValue.value) {
                                        if (newValue.value) {
                                            setNewOption(newValue)
                                            controlProps.field.onChange(newValue)
                                        }
                                    } else {
                                        setNewOption(undefined)
                                        controlProps.field.onChange(newValue)
                                    }
                                }}
                                onBlur={function onBlur(event: FocusEvent<HTMLInputElement, Element>) {
                                    controlProps.field.onBlur()
                                    if (event.target.value) {
                                        setNewOption({
                                            label: event.target.value,
                                            value: event.target.value,
                                        })
                                        setValue('roleName', {
                                            label: event.target.value,
                                            value: event.target.value,
                                        })
                                    }
                                }}
                                dirty
                                disabled={props.isAdding}
                                isLoading={props.isLoading}
                                classNameWrapper={styles.field}
                                onSearchChange={setSearchKey}
                                creatable
                                createLabel={function createLabel(inputValue: string) {
                                    return `Select "${inputValue}"`
                                }}
                            />
                        )
                    }}
                />

                <div className={styles.blockBottom}>
                    <Button
                        primary
                        className={styles.searchButton}
                        size='lg'
                        disabled={!isValid || props.isLoading || props.isAdding}
                        onClick={function onClick() {
                            onSubmit(createRoleName)
                        }}
                    >
                        Create Role
                    </Button>
                    <Button
                        primary
                        className={styles.searchButton}
                        size='lg'
                        variant='danger'
                        onClick={function onClick() {
                            resetAllValue()
                        }}
                    >
                        Clear
                    </Button>
                </div>
            </div>
        </form>
    )
}

export default RolesFilter
