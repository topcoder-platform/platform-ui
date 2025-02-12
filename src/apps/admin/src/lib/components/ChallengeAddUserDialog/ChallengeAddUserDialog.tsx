import {
    ChangeEvent,
    createContext,
    Dispatch,
    FC,
    KeyboardEventHandler,
    SetStateAction,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from 'react'
import { MultiValue, MultiValueProps } from 'react-select'
import _ from 'lodash'
import CreatableSelect from 'react-select/creatable'
import cn from 'classnames'

import {
    BaseModal,
    Button,
    IconOutline,
    InputSelect,
    InputSelectOption,
} from '~/libs/ui'

import {
    getMembersByHandle,
    getMemberSuggestionsByHandle,
} from '../../services'
import { ResourceRole } from '../../models'
import {
    ChallengeManagementContext,
    ChallengeManagementContextType,
} from '../../contexts'
import { useEventCallback } from '../../hooks'

import styles from './ChallengeAddUserDialog.module.scss'

interface Option {
    readonly label: string
    readonly value: string
}

export interface ChallengeAddUserDialogProps {
    open: boolean
    setOpen: (isOpen: boolean) => void
    onAdd: (payload: { handles: string[]; roleId: string }) => void
}

type SelectUserHandlesContextType = { invalidHandles: Set<string> }
const SelectUserHandlesContext = createContext<SelectUserHandlesContextType>({
    invalidHandles: new Set(),
})

const CustomMultiValue = (
    props: MultiValueProps<Option, true>,
): JSX.Element => {
    const { invalidHandles }: SelectUserHandlesContextType = useContext(
        SelectUserHandlesContext,
    )

    return (
        <div
            className={cn(styles.selectUserHandlesCustomMultiValue, {
                [styles.invalid]: invalidHandles.has(props.data.value),
            })}
        >
            <span className={styles.label}>{props.data.label}</span>
            <span {...props.removeProps} className={styles.removeIcon}>
                <IconOutline.XIcon className='icon icon-fill' />
            </span>
        </div>
    )
}

const SelectUserHandles: FC<{ onUsersSelect: (handles: string[]) => void }> = props => {
    const separatorRegEx = /[ ,\n\t;]+/

    const components = useMemo(
        () => ({
            DropdownIndicator: undefined,
            MultiValue: CustomMultiValue,
        }),
        [],
    )

    const [inputValue, setInputValue]: [
        string,
        Dispatch<SetStateAction<string>>,
    ] = useState('')
    const [value, setValue]: [
        readonly Option[],
        Dispatch<SetStateAction<readonly Option[]>>,
    ] = useState<readonly Option[]>([])
    const [options, setOptions]: [
        Option[],
        Dispatch<SetStateAction<Option[]>>,
    ] = useState<Option[]>([])
    const invalidHandles = useRef<Set<string>>(new Set<string>())

    const checkHandles = async (values: MultiValue<Option>): Promise<void> => {
        const handles = values.map(i => i.value)
        if (handles.length > 1) {
            const users = await getMembersByHandle(handles)
            handles.forEach(h => {
                if (
                    !users.find(
                        i => i.handle.toLowerCase() === h.toLowerCase(),
                    )
                ) {
                    invalidHandles.current.add(h)
                }
            })
        }
    }

    const handleKeyDown: KeyboardEventHandler = useEventCallback(event => {
        if (!inputValue) return

        switch (event.key) {
            case 'Enter': {
                const words = inputValue
                    .trim()
                    .split(separatorRegEx)
                    // remove ''
                    .filter(Boolean)
                    // remove duplicate
                    .filter((word, index, arr) => arr.indexOf(word) === index)

                const newValue = [...value.map(i => i.value), ...words]
                    // remove duplicate
                    .filter((val, index, arr) => arr.indexOf(val) === index)
                    .map(i => ({ label: i, value: i }))

                setValue(newValue)
                setInputValue('')
                event.preventDefault()
                props.onUsersSelect(newValue.map(i => i.value))
                checkHandles(newValue)
                break
            }

            case 'Tab': {
                setInputValue('')
                event.preventDefault()
                break
            }

            default: {
                break
            }
        }
    })

    const getSuggestions = _.debounce(
        async (currentInputValue: string): Promise<void> => {
            if (
                !inputValue
                || !inputValue.trim()
                || inputValue.trim().length < 2
            ) {
                return
            }

            const trimedInputValue = currentInputValue.trim()
            if (trimedInputValue.split(separatorRegEx).length === 1) {
                const members
                    = await getMemberSuggestionsByHandle(trimedInputValue)
                const newOptions: Option[] = members.map(i => ({
                    label: i.handle,
                    value: i.handle,
                }))
                setOptions(newOptions)
            }
        },
        750,
    )

    const handleValueChange = useEventCallback(
        (newValue: MultiValue<Option>) => {
            setValue(newValue)
            checkHandles(newValue)
            props.onUsersSelect(newValue.map(i => i.value))
        },
    )

    const handleInputChange = useEventCallback((newInputValue: string) => {
        setInputValue(newInputValue)
        getSuggestions(newInputValue)
    })

    const noop = useCallback(() => undefined, [])
    const context = useMemo(
        () => ({ invalidHandles: invalidHandles.current }),
        [invalidHandles.current], // eslint-disable-line react-hooks/exhaustive-deps, max-len -- unneccessary dependency: invalidHandles.current
    )
    return (
        <SelectUserHandlesContext.Provider value={context}>
            <div className={styles.selectUserHandles}>
                <div className={styles.selectUserHandlesTitle}>Handle</div>
                <CreatableSelect
                    components={components}
                    inputValue={inputValue}
                    value={value}
                    isClearable
                    isMulti
                    onChange={handleValueChange}
                    onInputChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder='Enter'
                    options={options}
                    noOptionsMessage={noop}
                    formatCreateLabel={noop}
                    menuPortalTarget={document.body}
                    classNames={{
                        container: () => styles.select,
                        menuPortal: () => styles.selectUserHandlesDropdownContainer,
                    }}
                    classNamePrefix={styles.sel}
                />
            </div>
        </SelectUserHandlesContext.Provider>
    )
}

const AddUserForm: FC<{
    onClose: () => void
    onAdd: ChallengeAddUserDialogProps['onAdd']
}> = props => {
    type FormValue = {
        handles: string[]
        roleId: string
    }
    const [formValue, setFormValue]: [
        FormValue,
        Dispatch<SetStateAction<FormValue>>,
    ] = useState<FormValue>({ handles: [], roleId: '' })
    const { resourceRoles }: ChallengeManagementContextType = useContext(
        ChallengeManagementContext,
    )
    const {
        resourceRoleOptions,
    }: { resourceRoleOptions: InputSelectOption[] } = useMemo(() => {
        const role2Option = (item: ResourceRole): InputSelectOption => ({
            label: item.name,
            value: item.id,
        })
        const emptyOption: InputSelectOption = { label: '', value: '' }

        return {
            resourceRoleOptions: [
                emptyOption,
                ...resourceRoles.map(role2Option),
            ],
        }
    }, [resourceRoles])

    const updateForm = (name: string, value: unknown): void => {
        setFormValue({
            ...formValue,
            [name]: value,
        })
    }

    const handleUsersSelect = useEventCallback((handles: string[]): void => updateForm('handles', handles))
    const handleRoleChange = useEventCallback(
        (event: ChangeEvent<HTMLInputElement>): void => updateForm('roleId', event.target.value),
    )
    const handleAdd = useEventCallback(() => props.onAdd({
        handles: formValue.handles,
        roleId: formValue.roleId,
    }))

    return (
        <div className={styles.addUserForm}>
            <div>
                <SelectUserHandles onUsersSelect={handleUsersSelect} />
                <InputSelect
                    name='roleId'
                    label='Role'
                    placeholder='Select'
                    options={resourceRoleOptions}
                    value={formValue.roleId}
                    onChange={handleRoleChange}
                    disabled={false}
                />
            </div>
            <div className={styles.actionButtons}>
                <Button secondary size='lg' onClick={props.onClose}>
                    Close
                </Button>
                <Button
                    primary
                    size='lg'
                    disabled={!formValue.handles.length || !formValue.roleId}
                    onClick={handleAdd}
                >
                    Add User
                </Button>
            </div>
        </div>
    )
}

const ChallengeAddUserDialog: FC<ChallengeAddUserDialogProps> = props => {
    const handleClose = useEventCallback(() => props.setOpen(false))
    const handleAdd = useEventCallback(
        (event: Parameters<ChallengeAddUserDialogProps['onAdd']>[0]) => {
            props.setOpen(false)
            props.onAdd(event)
        },
    )
    return (
        <BaseModal title='Add Users' onClose={handleClose} open={props.open}>
            <AddUserForm onClose={handleClose} onAdd={handleAdd} />
        </BaseModal>
    )
}

export default ChallengeAddUserDialog
