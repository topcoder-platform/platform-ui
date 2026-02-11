import { FC, useMemo } from 'react'

import { FormSelectField, FormSelectOption } from '../../../../lib/components/form'
import {
    useFetchChallengeTracks,
    UseFetchChallengeTracksResult,
} from '../../../../lib/hooks'

interface ChallengeTrackFieldProps {
    disabled?: boolean
}

export const ChallengeTrackField: FC<ChallengeTrackFieldProps> = (
    props: ChallengeTrackFieldProps,
) => {
    const tracksResult: UseFetchChallengeTracksResult = useFetchChallengeTracks()
    const isLoading = tracksResult.isLoading
    const tracks = tracksResult.tracks

    const options = useMemo<FormSelectOption[]>(
        () => tracks
            .filter(track => track.isActive)
            .sort((trackA, trackB) => trackA.name.localeCompare(trackB.name))
            .map(track => ({
                label: track.name,
                value: track.id,
            })),
        [tracks],
    )

    return (
        <FormSelectField
            disabled={props.disabled || isLoading}
            label='Challenge Track'
            name='trackId'
            options={options}
            placeholder='Select track'
            required
        />
    )
}

export default ChallengeTrackField
