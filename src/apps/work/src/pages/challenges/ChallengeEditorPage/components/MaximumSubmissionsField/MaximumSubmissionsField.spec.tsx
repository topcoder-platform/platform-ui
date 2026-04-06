/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { FC } from 'react'
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import {
    FormProvider,
    useForm,
    useWatch,
} from 'react-hook-form'

import { ChallengeEditorFormData } from '../../../../../lib/models'

import { MaximumSubmissionsField } from './MaximumSubmissionsField'

jest.mock('../../../../../lib/utils', () => ({
    getMetadataValue: (
        metadata: Array<{
            name: string
            value: string
        }> | undefined,
        name: string,
    ): string | undefined => metadata
        ?.find(entry => entry.name === name)
        ?.value,
    setMetadataValue: (
        metadata: Array<{
            name: string
            value: string
        }> | undefined,
        name: string,
        value: string,
    ): Array<{
        name: string
        value: string
    }> => {
        const metadataEntries = metadata || []
        const existingEntryIndex = metadataEntries.findIndex(entry => entry.name === name)

        return existingEntryIndex >= 0
            ? metadataEntries.map((entry, index) => (index === existingEntryIndex
                ? {
                    ...entry,
                    value,
                }
                : entry))
            : [
                ...metadataEntries,
                {
                    name,
                    value,
                },
            ]
    },
}))

interface TestHarnessProps {
    defaultMetadata?: Array<{
        name: string
        value: string
    }>
}

const MetadataWatcher: FC = () => {
    const metadata = useWatch<ChallengeEditorFormData>({
        name: 'metadata',
    })

    return <output data-testid='metadata-value'>{JSON.stringify(metadata || [])}</output>
}

const TestHarness: FC<TestHarnessProps> = (props: TestHarnessProps) => {
    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: {
            description: 'Public challenge specification',
            metadata: props.defaultMetadata,
            name: 'Design challenge',
            skills: [],
            tags: [],
            trackId: 'design-track',
            typeId: 'design-type',
        },
    })

    return (
        <FormProvider {...formMethods}>
            <MaximumSubmissionsField />
            <MetadataWatcher />
        </FormProvider>
    )
}

describe('MaximumSubmissionsField', () => {
    it('does not render submission-cap controls', () => {
        render(
            <TestHarness
                defaultMetadata={[{
                    name: 'submissionLimit',
                    value: JSON.stringify({
                        count: '3',
                        limit: 'true',
                        unlimited: 'false',
                    }),
                }]}
            />,
        )

        expect(screen.queryByRole('checkbox', { name: 'Limit' }))
            .toBeNull()
        expect(screen.queryByRole('spinbutton', { name: 'Limit Count' }))
            .toBeNull()
    })

    it('normalizes legacy submission-limit metadata to unlimited', async () => {
        render(
            <TestHarness
                defaultMetadata={[{
                    name: 'submissionLimit',
                    value: JSON.stringify({
                        count: '3',
                        limit: 'true',
                        unlimited: 'false',
                    }),
                }]}
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('metadata-value').textContent)
                .toBe(JSON.stringify([{
                    name: 'submissionLimit',
                    value: JSON.stringify({
                        count: '',
                        limit: 'false',
                        unlimited: 'true',
                    }),
                }]))
        })
    })

    it('adds unlimited submission-limit metadata when it is missing', async () => {
        render(<TestHarness />)

        await waitFor(() => {
            expect(screen.getByTestId('metadata-value').textContent)
                .toBe(JSON.stringify([{
                    name: 'submissionLimit',
                    value: JSON.stringify({
                        count: '',
                        limit: 'false',
                        unlimited: 'true',
                    }),
                }]))
        })
    })
})
