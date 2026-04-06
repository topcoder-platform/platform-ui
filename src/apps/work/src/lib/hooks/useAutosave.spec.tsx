/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    act,
    render,
    waitFor,
} from '@testing-library/react'

import {
    useAutosave,
} from './useAutosave'

interface TestComponentProps {
    formValues: Record<string, unknown>
    onSave: (values: Record<string, unknown>) => Promise<void>
}

const TestComponent = (props: TestComponentProps): JSX.Element => {
    useAutosave<Record<string, unknown>>({
        delay: 100,
        enabled: true,
        formValues: props.formValues,
        onSave: props.onSave,
    })

    return <div>Autosave Test</div>
}

async function advanceAutosaveDelay(): Promise<void> {
    await act(async () => {
        jest.advanceTimersByTime(100)
        await Promise.resolve()
    })
}

describe('useAutosave', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('does not retry equivalent values after a failed save until the form changes again', async () => {
        const onSave = jest.fn<Promise<void>, [Record<string, unknown>]>()
            .mockRejectedValue(new Error('Failed to save engagement'))

        const rendered: ReturnType<typeof render> = render(
            <TestComponent
                formValues={{
                    projectId: '100',
                }}
                onSave={onSave}
            />,
        )

        rendered.rerender(
            <TestComponent
                formValues={{
                    projectId: '200',
                }}
                onSave={onSave}
            />,
        )

        await advanceAutosaveDelay()

        await waitFor(() => {
            expect(onSave)
                .toHaveBeenCalledTimes(1)
        })

        rendered.rerender(
            <TestComponent
                formValues={{
                    projectId: '200',
                }}
                onSave={onSave}
            />,
        )

        await advanceAutosaveDelay()

        expect(onSave)
            .toHaveBeenCalledTimes(1)

        rendered.rerender(
            <TestComponent
                formValues={{
                    projectId: '300',
                }}
                onSave={onSave}
            />,
        )

        await advanceAutosaveDelay()

        await waitFor(() => {
            expect(onSave)
                .toHaveBeenCalledTimes(2)
        })
    })
})
