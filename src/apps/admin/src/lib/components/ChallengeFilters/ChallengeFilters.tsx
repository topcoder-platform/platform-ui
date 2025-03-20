import { ChangeEvent, FC, FocusEvent, useContext, useMemo } from 'react'

import { Button, InputSelect, InputSelectOption, InputText } from '~/libs/ui'

import {
    ChallengeFilterCriteria,
    ChallengeStatus,
    ChallengeTrack,
    ChallengeType,
} from '../../models'
import {
    ChallengeManagementContext,
    ChallengeManagementContextType,
} from '../../contexts'
import { useEventCallback, useOnComponentDidMount } from '../../hooks'

import styles from './ChallengeFilters.module.scss'

interface ChallengeFiltersProps {
    filterCriteria: ChallengeFilterCriteria
    disabled: boolean
    showResetButton: boolean
    onFilterCriteriaChange: (newFilterCriteria: ChallengeFilterCriteria) => void
    onSearch: () => void
    onReset: () => void
}

const ChallengeFilters: FC<ChallengeFiltersProps> = props => {
    const {
        challengeTypes,
        challengeTracks,
        challengeStatuses,
        loadChallengeTypes,
        loadChallengeTracks,
    }: ChallengeManagementContextType = useContext(ChallengeManagementContext)
    const {
        challengeTypeOptions,
        challengeTrackOptions,
        challengeStatusOptions,
    }: {
        challengeTypeOptions: InputSelectOption[]
        challengeTrackOptions: InputSelectOption[]
        challengeStatusOptions: InputSelectOption[]
    } = useMemo(() => {
        const type2Option = (item: ChallengeType): InputSelectOption => ({
            label: item.name,
            value: item.abbreviation,
        })
        const track2Option = (item: ChallengeTrack): InputSelectOption => ({
            label: item.name,
            value: item.abbreviation,
        })
        const status2Option = (item: ChallengeStatus): InputSelectOption => ({
            label: item,
            value: item,
        })
        const emptyOption: InputSelectOption = { label: 'All', value: '' }

        return {
            challengeStatusOptions: [
                emptyOption,
                ...challengeStatuses.map(status2Option),
            ],
            challengeTrackOptions: [
                emptyOption,
                ...challengeTracks.map(track2Option),
            ],
            challengeTypeOptions: [
                emptyOption,
                ...challengeTypes.map(type2Option),
            ],
        }
    }, [challengeTypes, challengeTracks, challengeStatuses])

    useOnComponentDidMount(() => {
        loadChallengeTypes()
        loadChallengeTracks()
    })

    const handleFilterChange = (
        event: FocusEvent<HTMLInputElement> | ChangeEvent<HTMLInputElement>,
        field: string,
    ): void => {
        let change
        if (field === 'legacyId') {
            // Validate if the input contains only numbers
            if (/^[0-9]*$/.test(event.target.value)) {
                change = {
                    [field]: parseInt(event.target.value || '0', 10),
                }
            } else {
                event.preventDefault()
                event.target.value = event.target.value.replace(/[^0-9]/g, '')
                return
            }
        } else {
            change = { [field]: event.target.value }
        }

        const newFilterCriteria: ChallengeFilterCriteria = {
            ...props.filterCriteria,
            ...change,
            page: 1,
        }

        props.onFilterCriteriaChange(newFilterCriteria)
    }

    const createHandleFilterChange
        = (field: string) => (
            event: FocusEvent<HTMLInputElement> | ChangeEvent<HTMLInputElement>,
        ): void => handleFilterChange(event, field)

    const handleReset = useEventCallback((): void => {
        const newFilterCriteria = {
            ...props.filterCriteria,
            page: 1,
        }
        props.onFilterCriteriaChange(newFilterCriteria)
        props.onReset()
    })

    return (
        <div className={styles.challengeFilters}>
            <div className={styles.filters}>
                <InputText
                    type='text'
                    name='name'
                    label='Name'
                    placeholder='Enter'
                    tabIndex={0}
                    value={props.filterCriteria.name}
                    onChange={createHandleFilterChange('name')}
                    disabled={props.disabled}
                    forceUpdateValue
                />
                <InputText
                    type='text'
                    name='challengeId'
                    label='Challenge ID'
                    placeholder='Enter'
                    tabIndex={0}
                    value={props.filterCriteria.challengeId}
                    onChange={createHandleFilterChange('challengeId')}
                    disabled={props.disabled}
                    forceUpdateValue
                />
                <InputText
                    type='text'
                    name='legacyId'
                    label='Legacy ID'
                    placeholder='Enter'
                    tabIndex={0}
                    value={
                        props.filterCriteria.legacyId
                            ? `${props.filterCriteria.legacyId}`
                            : ''
                    }
                    onChange={createHandleFilterChange('legacyId')}
                    disabled={props.disabled}
                    forceUpdateValue
                />
                <InputSelect
                    name='type'
                    label='Type'
                    placeholder='Select'
                    options={challengeTypeOptions}
                    value={props.filterCriteria.type}
                    onChange={createHandleFilterChange('type')}
                    disabled={props.disabled}
                />
                <InputSelect
                    name='track'
                    label='Track'
                    placeholder='Select'
                    options={challengeTrackOptions}
                    value={props.filterCriteria.track}
                    onChange={createHandleFilterChange('track')}
                    disabled={props.disabled}
                />
                <InputSelect
                    name='status'
                    label='Status'
                    placeholder='Select'
                    options={challengeStatusOptions}
                    value={props.filterCriteria.status}
                    onChange={createHandleFilterChange('status')}
                    disabled={props.disabled}
                />
            </div>
            {!props.showResetButton && (
                <Button
                    primary
                    className={styles.searchButton}
                    onClick={props.onSearch}
                    disabled={props.disabled}
                    size='lg'
                >
                    Search
                </Button>
            )}
            {props.showResetButton && (
                <Button
                    secondary
                    className={styles.searchButton}
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

export default ChallengeFilters
