import { ChangeEvent, FC, useContext, useEffect, useMemo, useRef } from 'react'
import { Button, InputSelect, InputSelectOption } from '~/libs/ui'
import { ChallengeManagementContext } from '../../contexts'
import { useOnComponentDidMount } from '../../hooks'
import { ChallengeResourceFilterCriteria, ResourceRole } from '../../models'
import _ from 'lodash'
import styles from './ChallengeUserFilters.module.scss'

interface ChallengeUserFiltersProps {
  filterCriteria: ChallengeResourceFilterCriteria
  isFilteringOrRemoving: boolean
  onFilterCriteriaChange: (newFilterCriteria: ChallengeResourceFilterCriteria) => void
  onFilter: () => void
}

const ChallengeUserFilters: FC<ChallengeUserFiltersProps> = ({
    filterCriteria,
    isFilteringOrRemoving,
    onFilterCriteriaChange,
    onFilter,
}) => {
    const DEFAULT_ROLE_FILTER_NAME = 'Submitter'
    const { resourceRoles, loadResourceRoles } = useContext(ChallengeManagementContext)
    const { resourceRoleOptions, defaultResourceRoleOption } = useMemo(() => {
        const role2Option = (item: ResourceRole): InputSelectOption => ({ label: item.name, value: item.id })
        const emptyOption: InputSelectOption = { label: '', value: '' }
        const defaultResourceRoleOption: InputSelectOption | undefined = _.filter(resourceRoles, {
            name: DEFAULT_ROLE_FILTER_NAME,
        })
            .map(role2Option)[0]

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

    return (
        <div className={styles.challengeUserFilters}>
            <div className={styles.filters}>
                <InputSelect
                    name='roleId'
                    label='Role'
                    placeholder='Select'
                    options={resourceRoleOptions}
                    value={filterCriteria.roleId}
                    onChange={event => handleFilterChange(event, 'roleId')}
                    disabled={isFilteringOrRemoving}
                />
            </div>
            <Button primary className={styles.filterButton} onClick={onFilter} disabled={isFilteringOrRemoving} size='lg'>
                Filter
            </Button>
        </div>
    )
}

export default ChallengeUserFilters
