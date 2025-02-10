import { ChangeEvent, FC, FocusEvent, useContext, useMemo } from 'react'
import { Button, InputSelect, InputSelectOption, InputText } from '~/libs/ui'
import { ChallengeFilterCriteria, ChallengeStatus, ChallengeTrack, ChallengeType } from '../../models'
import { ChallengeManagementContext } from '../../contexts'
import { useOnComponentDidMount } from '../../hooks'
import styles from './ChallengeFilters.module.scss'

interface ChallengeFiltersProps {
  filterCriteria: ChallengeFilterCriteria
  isSearchingOrInitializing: boolean
  onFilterCriteriaChange: (newFilterCriteria: ChallengeFilterCriteria) => void
  onSearch: () => void
}

const ChallengeFilters: FC<ChallengeFiltersProps> = ({
    filterCriteria,
    isSearchingOrInitializing,
    onFilterCriteriaChange,
    onSearch,
}) => {
    const { challengeTypes, challengeTracks, challengeStatuses, loadChallengeTypes, loadChallengeTracks }
    = useContext(ChallengeManagementContext)
    const { challengeTypeOptions, challengeTrackOptions, challengeStatusOptions } = useMemo(() => {
        const type2Option = (item: ChallengeType): InputSelectOption => ({ label: item.name, value: item.abbreviation })
        const track2Option = (item: ChallengeTrack): InputSelectOption => ({
            label: item.name,
            value: item.abbreviation,
        })
        const status2Option = (item: ChallengeStatus): InputSelectOption => ({ label: item, value: item })
        const emptyOption: InputSelectOption = { label: '', value: '' }

        return {
            challengeTypeOptions: [emptyOption, ...challengeTypes.map(type2Option)],
            challengeTrackOptions: [emptyOption, ...challengeTracks.map(track2Option)],
            challengeStatusOptions: [emptyOption, ...challengeStatuses.map(status2Option)],
        }
    }, [challengeTypes, challengeTracks, challengeStatuses])

    useOnComponentDidMount(() => {
        loadChallengeTypes()
        loadChallengeTracks()
    })

    const handleFilterChange = (event: FocusEvent<HTMLInputElement> | ChangeEvent<HTMLInputElement>, field: string) => {
        let change
        if (field === 'legacyId') {
            // Validate if the input contains only numbers
            if (/^[0-9]*$/.test(event.target.value)) {
                change = { [field]: parseInt(event.target.value || '0', 10) }
            } else {
                event.preventDefault()
                event.target.value = event.target.value.replace(/[^0-9]/g, '')
                return
            }
        } else {
            change = { [field]: event.target.value }
        }

        const newFilterCriteria: ChallengeFilterCriteria = {
            ...filterCriteria,
            ...change,
        }

        onFilterCriteriaChange(newFilterCriteria)
    }

    return (
        <div className={styles.challengeFilters}>
            <div className={styles.filters}>
                <InputText
                    type='text'
                    name='name'
                    label='Name'
                    placeholder='Enter'
                    tabIndex={0}
                    value={filterCriteria.name}
                    onChange={event => handleFilterChange(event, 'name')}
                    disabled={isSearchingOrInitializing}
                    forceUpdateValue
                />
                <InputText
                    type='text'
                    name='challengeId'
                    label='Challenge ID'
                    placeholder='Enter'
                    tabIndex={0}
                    value={filterCriteria.challengeId}
                    onChange={event => handleFilterChange(event, 'challengeId')}
                    disabled={isSearchingOrInitializing}
                    forceUpdateValue
                />
                <InputText
                    type='text'
                    name='legacyId'
                    label='Legacy ID'
                    placeholder='Enter'
                    tabIndex={0}
                    value={filterCriteria.legacyId ? `${filterCriteria.legacyId}` : ''}
                    onChange={event => handleFilterChange(event, 'legacyId')}
                    disabled={isSearchingOrInitializing}
                    forceUpdateValue
                />
                <InputSelect
                    name='type'
                    label='Type'
                    placeholder='Select'
                    options={challengeTypeOptions}
                    value={filterCriteria.type}
                    onChange={event => handleFilterChange(event, 'type')}
                    disabled={isSearchingOrInitializing}
                />
                <InputSelect
                    name='track'
                    label='Track'
                    placeholder='Select'
                    options={challengeTrackOptions}
                    value={filterCriteria.track}
                    onChange={event => handleFilterChange(event, 'track')}
                    disabled={isSearchingOrInitializing}
                />
                <InputSelect
                    name='status'
                    label='Status'
                    placeholder='Select'
                    options={challengeStatusOptions}
                    value={filterCriteria.status}
                    onChange={event => handleFilterChange(event, 'status')}
                    disabled={isSearchingOrInitializing}
                />
            </div>
            <Button primary className={styles.searchButton} onClick={onSearch} disabled={isSearchingOrInitializing} size='lg'>
                Search
            </Button>
        </div>
    )
}

export default ChallengeFilters
