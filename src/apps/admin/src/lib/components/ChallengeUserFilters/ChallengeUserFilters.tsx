import { ChangeEvent, FC, useContext, useEffect, useMemo, useRef } from 'react'
import _ from 'lodash'

import { Button, InputSelect, InputSelectOption } from '~/libs/ui'

import {
    ChallengeManagementContext,
    ChallengeManagementContextType,
} from '../../contexts'
import { useEventCallback, useOnComponentDidMount } from '../../hooks'
import { ChallengeResourceFilterCriteria, ResourceRole } from '../../models'

import styles from './ChallengeUserFilters.module.scss'

interface ChallengeUserFiltersProps {
    filterCriteria: ChallengeResourceFilterCriteria
    disabled: boolean
    showResetButton: boolean
    onFilterCriteriaChange: (
        newFilterCriteria: ChallengeResourceFilterCriteria,
    ) => void
    onFilter: () => void
    onFiltersInitialize: () => void
    onReset: () => void
}

const ChallengeUserFilters: FC<ChallengeUserFiltersProps> = props => {
    const DEFAULT_ROLE_FILTER_NAME = 'Submitter'
    const { resourceRoles, loadResourceRoles }: ChallengeManagementContextType
        = useContext(ChallengeManagementContext)
    const {
        resourceRoleOptions,
        defaultResourceRoleOption,
    }: {
        resourceRoleOptions: InputSelectOption[]
        defaultResourceRoleOption?: InputSelectOption
    } = useMemo(() => {
        const role2Option = (item: ResourceRole): InputSelectOption => ({
            label: item.name,
            value: item.id,
        })
        const emptyOption: InputSelectOption = { label: 'All', value: '' }
        const o: InputSelectOption | undefined = _.filter(resourceRoles, {
            name: DEFAULT_ROLE_FILTER_NAME,
        })
            .map(role2Option)[0]

        return {
            defaultResourceRoleOption: o,
            resourceRoleOptions: [
                emptyOption,
                ...resourceRoles.map(role2Option),
            ],
        }
    }, [resourceRoles])

    useOnComponentDidMount(() => {
        loadResourceRoles()
    })

    const setSelectedDefaultResourceRole = (): void => {
        if (defaultResourceRoleOption) {
            props.onFilterCriteriaChange({
                ...props.filterCriteria,
                roleId: defaultResourceRoleOption.value,
            })
        }
    }

    const defaultRoleSet = useRef(false)
    useEffect(() => {
        if (defaultRoleSet.current) {
            return
        }

        if (resourceRoles.length) {
            defaultRoleSet.current = true
            setSelectedDefaultResourceRole()
            props.onFiltersInitialize()
        }
    }, [resourceRoles.length]) // eslint-disable-line react-hooks/exhaustive-deps -- missing dependency: props

    const handleFilterChange = useEventCallback(
        (event: ChangeEvent<HTMLInputElement>, field: string): void => {
            const change = { [field]: event.target.value }
            const newFilterCriteria: ChallengeResourceFilterCriteria = {
                ...props.filterCriteria,
                ...change,
            }
            props.onFilterCriteriaChange(newFilterCriteria)
        },
    )

    const handleReset = useEventCallback((): void => {
        const newFilterCriteria = {
            ...props.filterCriteria,
            page: 1,
        }
        props.onFilterCriteriaChange(newFilterCriteria)
        props.onReset()
    })

    const handleRoleChange = useEventCallback(
        (event: ChangeEvent<HTMLInputElement>) => handleFilterChange(event, 'roleId'),
    )

    return (
        <div className={styles.challengeUserFilters}>
            <div className={styles.filters}>
                <InputSelect
                    name='roleId'
                    label='Role'
                    placeholder='Select'
                    options={resourceRoleOptions}
                    value={props.filterCriteria.roleId}
                    onChange={handleRoleChange}
                    disabled={props.disabled}
                />
            </div>
            {!props.showResetButton && (
                <Button
                    primary
                    className={styles.filterButton}
                    onClick={props.onFilter}
                    disabled={props.disabled}
                    size='lg'
                >
                    Filter
                </Button>
            )}
            {props.showResetButton && (
                <Button
                    secondary
                    className={styles.filterButton}
                    onClick={handleReset}
                    disabled={props.disabled}
                    size='lg'
                >
                    Reset
                </Button>
            )}
        </div>
    )
}

export default ChallengeUserFilters
