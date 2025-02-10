import { ChangeEvent, FC, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Button, InputSelect, InputSelectOption } from '~/libs/ui'
import { ChallengeManagementContext } from '../../contexts'
import { useOnComponentDidMount } from '../../hooks'
import { ChallengeResourceFilterCriteria, ResourceRole } from '../../models'
import _ from 'lodash'
import styles from './ChallengeUserFilters.module.scss'

interface ChallengeUserFiltersProps {
  filterCriteria: ChallengeResourceFilterCriteria
  disabled: boolean
  showResetButton: boolean
  onFilterCriteriaChange: (newFilterCriteria: ChallengeResourceFilterCriteria) => void
  onFilter: () => void
  onFiltersInitialize: () => void
  onReset: () => void
}

const ChallengeUserFilters: FC<ChallengeUserFiltersProps> = ({
    filterCriteria,
    disabled,
    showResetButton,
    onFilterCriteriaChange,
    onFilter,
    onFiltersInitialize,
    onReset,
}) => {
    const DEFAULT_ROLE_FILTER_NAME = 'Submitter'
    const { resourceRoles, loadResourceRoles } = useContext(ChallengeManagementContext)
    const { resourceRoleOptions, defaultResourceRoleOption } = useMemo(() => {
        const role2Option = (item: ResourceRole): InputSelectOption => ({ label: item.name, value: item.id })
        const emptyOption: InputSelectOption = { label: '', value: '' }
        const defaultResourceRoleOption: InputSelectOption | undefined = _.filter(resourceRoles, {
            name: DEFAULT_ROLE_FILTER_NAME,
    }).map(role2Option)[0]

        return {
            resourceRoleOptions: [emptyOption, ...resourceRoles.map(role2Option)],
            defaultResourceRoleOption,
        }
    }, [resourceRoles])

    useOnComponentDidMount(() => {
        loadResourceRoles()
    })

    const setSelectedDefaultResourceRole = () => {
        if (defaultResourceRoleOption) {
            onFilterCriteriaChange({
                ...filterCriteria,
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
            onFiltersInitialize()
        }
    }, [resourceRoles.length])

    const handleFilterChange = (event: ChangeEvent<HTMLInputElement>, field: string) => {
        const change = { [field]: event.target.value }
        const newFilterCriteria: ChallengeResourceFilterCriteria = {
            ...filterCriteria,
            ...change,
        }
        onFilterCriteriaChange(newFilterCriteria)
  }

    const handleReset = () => {
        const newFilterCriteria = {
            ...filterCriteria,
            page: 1,
        }
        onFilterCriteriaChange(newFilterCriteria)
        onReset()
    }

    return (
        <div className={styles.challengeUserFilters}>
            <div className={styles.filters}>
                <InputSelect
                    name='roleId'
                    label='Role'
                    placeholder='Select'
                    options={resourceRoleOptions}
                    value={filterCriteria.roleId}
                    onChange={(event) => handleFilterChange(event, 'roleId')}
                    disabled={disabled}
                />
            </div>
            {!showResetButton && (
                <Button primary className={styles.filterButton} onClick={onFilter} disabled={disabled} size='lg'>
                        Filter
                </Button>
            )}
            {showResetButton && (
                <Button secondary className={styles.filterButton} onClick={handleReset} disabled={disabled} size='lg'>
                Reset
                </Button>
            )}
        </div>
    )
}

export default ChallengeUserFilters
