import { createContext, FC, KeyboardEventHandler, useContext, useMemo, useRef, useState } from 'react'
import { BaseModal, Button, IconOutline, InputSelect, InputSelectOption } from '~/libs/ui'
import { MultiValue, MultiValueProps } from 'react-select'
import { ResourceRole } from '../../models'
import { getMembersByHandle, getMemberSuggestionsByHandle } from '../../services'
import _ from 'lodash'
import CreatableSelect from 'react-select/creatable'
import cn from 'classnames'
import { ChallengeManagementContext } from '../../contexts'
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

const CustomMultiValue = (props: MultiValueProps<Option, true>): JSX.Element => {
    const { data, removeProps } = props
    const { invalidHandles } = useContext(SelectUserHandlesContext)

    return (
        <div className={cn(styles.selectUserHandlesCustomMultiValue, { [styles.invalid]: invalidHandles.has(data.value) })}>
            <span className={styles.label}>{data.label}</span>
            <span {...removeProps} className={styles.removeIcon}>
                <IconOutline.XIcon className='icon icon-fill' />
            </span>
        </div>
    )
}

const SelectUserHandlesContext = createContext<{ invalidHandles: Set<string> }>({ invalidHandles: new Set() })

const SelectUserHandles: FC<{ onUsersSelect: (handles: string[]) => void }> = ({ onUsersSelect }) => {
    const separatorRegEx = /[ ,\n\t;]+/

    const components = {
        DropdownIndicator: null,
        MultiValue: CustomMultiValue,
    }

    const [inputValue, setInputValue] = useState('')
    const [value, setValue] = useState<readonly Option[]>([])
    const [options, setOptions] = useState<Option[]>([])
    const invalidHandles = useRef(new Set<string>())

    const handleKeyDown: KeyboardEventHandler = event => {
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
                onUsersSelect(newValue.map(i => i.value))
                checkHandles(newValue)
                break
            }

            case 'Tab':
                setInputValue('')
                event.preventDefault()
        }
    }

    const getSuggestions = _.debounce(async (inputValue: string) => {
        if (!inputValue || !inputValue.trim() || inputValue.trim().length < 2) {
            return
        }

        inputValue = inputValue.trim()
        if (inputValue.split(separatorRegEx).length == 1) {
            const members = await getMemberSuggestionsByHandle(inputValue)
            const newOptions: Option[] = members.map(i => ({ label: i.handle, value: i.handle }))
            setOptions(newOptions)
        }
    }, 750)

    const checkHandles = async (value: MultiValue<Option>) => {
        const handles = value.map(i => i.value)
        if (handles.length > 1) {
            const users = await getMembersByHandle(handles)
            handles.forEach(h => {
                if (!users.find(i => i.handle.toLowerCase() === h.toLowerCase())) {
                    invalidHandles.current.add(h)
                }
            })
        }
    }

    const handleValueChange = (newValue: MultiValue<Option>) => {
        setValue(newValue)
        checkHandles(newValue)
        onUsersSelect(newValue.map(i => i.value))
    }

    const handleInputChange = (newInputValue: string) => {
        setInputValue(newInputValue)
        getSuggestions(newInputValue)
    }

    return (
        <SelectUserHandlesContext.Provider value={{ invalidHandles: invalidHandles.current }}>
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
                    noOptionsMessage={() => null}
                    formatCreateLabel={() => null}
                    menuPortalTarget={document.body}
                    classNames={{
                        menuPortal: () => styles.selectUserHandlesDropdownContainer,
                    }}
                />
            </div>
        </SelectUserHandlesContext.Provider>
    )
}

const AddUserForm: FC<{ onClose: () => void; onAdd: ChallengeAddUserDialogProps['onAdd'] }> = ({ onClose, onAdd }) => {
    const [formValue, setFormValue] = useState<{ handles: string[]; roleId: string }>({ handles: [], roleId: '' })
    const { resourceRoles } = useContext(ChallengeManagementContext)
    const { resourceRoleOptions } = useMemo(() => {
        const role2Option = (item: ResourceRole): InputSelectOption => ({ label: item.name, value: item.id })
        const emptyOption: InputSelectOption = { label: '', value: '' }

        return {
            resourceRoleOptions: [emptyOption, ...resourceRoles.map(role2Option)],
        }
    }, [resourceRoles])

    const updateForm = (name: string, value: unknown) => {
        setFormValue({
            ...formValue,
            [name]: value,
        })
    }

    return (
        <div className={styles.addUserForm}>
            <div>
                <SelectUserHandles onUsersSelect={handles => updateForm('handles', handles)} />
                <InputSelect
                    name='roleId'
                    label='Role'
                    placeholder='Select'
                    options={resourceRoleOptions}
                    value={formValue.roleId}
                    onChange={event => updateForm('roleId', event.target.value)}
                    disabled={false}
                />
            </div>
            <div className={styles.actionButtons}>
                <Button secondary size='lg' onClick={onClose}>
                    Close
                </Button>
                <Button
                    primary
                    size='lg'
                    disabled={!formValue.handles.length || !formValue.roleId}
                    onClick={() => onAdd({ handles: formValue.handles, roleId: formValue.roleId })}
                >
                    Add User
                </Button>
            </div>
        </div>
    )
}

const ChallengeAddUserDialog: FC<ChallengeAddUserDialogProps> = ({ open, setOpen, onAdd }) => (
    <BaseModal title='Add Users' onClose={() => setOpen(false)} open={open}>
        <AddUserForm
            onClose={() => setOpen(false)}
            onAdd={event => {
                setOpen(false)
                onAdd(event)
            }}
        />
    </BaseModal>
)

export default ChallengeAddUserDialog
