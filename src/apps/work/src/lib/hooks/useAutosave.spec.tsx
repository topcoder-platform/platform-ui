/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    act,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import {
    useAutosave,
    UseAutosaveResult,
} from './useAutosave'

interface TestComponentProps {
    enabled?: boolean
    formValues: Record<string, unknown>
    onSave: (values: Record<string, unknown>) => Promise<void>
}

const TestComponent = (props: TestComponentProps): JSX.Element => {
    const { saveStatus }: UseAutosaveResult = useAutosave<Record<string, unknown>>({
        delay: 100,
        enabled: props.enabled,
        formValues: props.formValues,
        onSave: props.onSave,
    })

    return (
        <div>
            <div>Autosave Test</div>
            <div data-testid='save-status'>{saveStatus}</div>
        </div>
    )
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

    it('keeps a pending autosave queued across rerenders with equivalent values', async () => {
        const onSave = jest.fn<Promise<void>, [Record<string, unknown>]>()
            .mockResolvedValue(undefined)

        const rendered: ReturnType<typeof render> = render(
            <TestComponent
                formValues={{
                    projectId: '100',
                }}
                onSave={onSave}
            />,
        )
        const rerender: ReturnType<typeof render>['rerender'] = rendered.rerender

        rerender(
            <TestComponent
                formValues={{
                    projectId: '200',
                }}
                onSave={onSave}
            />,
        )

        await act(async () => {
            jest.advanceTimersByTime(50)
        })

        rerender(
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
        const rerender: ReturnType<typeof render>['rerender'] = rendered.rerender

        rerender(
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

        rerender(
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

        rerender(
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

    it('resets saved status when form values change after a successful save', async () => {
        const onSave = jest.fn<Promise<void>, [Record<string, unknown>]>()
            .mockResolvedValue(undefined)

        const rendered = render(
            <TestComponent
                formValues={{ projectId: '100' }}
                onSave={onSave}
            />,
        )
        const rerender = rendered.rerender

        // Trigger the autosave effect by re-rendering after initial render.
        rerender(
            <TestComponent
                formValues={{ projectId: '100' }}
                onSave={onSave}
            />,
        )

        await advanceAutosaveDelay()

        await waitFor(() => {
            expect(onSave)
                .toHaveBeenCalledTimes(1)
        })

        expect(screen.getByTestId('save-status').textContent)
            .toBe('saved')

        rerender(
            <TestComponent
                formValues={{ projectId: '200' }}
                onSave={onSave}
            />,
        )

        await waitFor(() => {
            expect(screen.getByTestId('save-status').textContent)
                .toBe('idle')
        })
    })
})
