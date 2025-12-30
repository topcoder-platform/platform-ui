import {
    ChangeEvent,
    FC,
    MouseEvent,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'

import { ConfigForm, ConfigTable, PageWrapper, Runner } from '~/apps/tester/src/lib/components'
import type { BreadCrumbData } from '~/apps/review/src/lib/models'

import { TesterAppContext, type TesterAppContextModel } from '../../lib/contexts'
import type { FlowConfigUnion, FlowVariant } from '../../lib/types'
import { FLOW_DEFINITIONS, ORDERED_FLOW_KEYS } from '../../lib/flows'

import styles from './FlowsPage.module.scss'

type ViewState = 'home' | 'edit' | 'runFull' | 'runToStep'

type FlowPalette = {
    base: string
    soft: string
}

const FLOW_PALETTE: Record<FlowVariant, FlowPalette> = {
    design: { base: '#EA580C', soft: '#FFEDD5' },
    designFailReview: { base: '#EA580C', soft: '#FFEDD5' },
    designFailScreening: { base: '#EA580C', soft: '#FFEDD5' },
    designSingle: { base: '#EA580C', soft: '#FFEDD5' },
    first2finish: { base: '#047857', soft: '#D1FAE5' },
    full: { base: '#2563EB', soft: '#DBEAFE' },
    topgear: { base: '#7C3AED', soft: '#EDE9FE' },
    topgearLate: { base: '#DC2626', soft: '#FEE2E2' },
}

const initialViewState = ORDERED_FLOW_KEYS.reduce<Record<FlowVariant, ViewState>>(
    (accumulator: Record<FlowVariant, ViewState>, key: FlowVariant) => {
        accumulator[key] = 'home'
        return accumulator
    },
    {} as Record<FlowVariant, ViewState>,
)

const initialToStepState = ORDERED_FLOW_KEYS.reduce<Record<FlowVariant, string>>(
    (accumulator: Record<FlowVariant, string>, key: FlowVariant) => {
        accumulator[key] = FLOW_DEFINITIONS[key].defaultToStep
        return accumulator
    },
    {} as Record<FlowVariant, string>,
)

export const FlowsPage: FC = () => {
    const {
        getFlowConfig,
        updateFlowConfig,
        isConfigLoaded,
    }: TesterAppContextModel = useContext(TesterAppContext)

    const [activeFlow, setActiveFlow] = useState<FlowVariant>('full')
    const [views, setViews] = useState<Record<FlowVariant, ViewState>>(initialViewState)
    const [toStepState, setToStepState] = useState<Record<FlowVariant, string>>(initialToStepState)

    useEffect(() => {
        const root = document.documentElement
        const palette = FLOW_PALETTE[activeFlow]

        root.style.setProperty('--tester-primary-color', palette.base)
        root.style.setProperty('--tester-primary-soft', palette.soft)

        return () => {
            root.style.removeProperty('--tester-primary-color')
            root.style.removeProperty('--tester-primary-soft')
        }
    }, [activeFlow])

    const flowConfig = useMemo(() => getFlowConfig(activeFlow), [activeFlow, getFlowConfig])
    const currentView = views[activeFlow]
    const flowDefinition = FLOW_DEFINITIONS[activeFlow]
    const runSteps = flowDefinition.steps
    const currentToStep = toStepState[activeFlow]
    const showRunner = currentView === 'runFull' || currentView === 'runToStep'

    const breadcrumb: BreadCrumbData[] = useMemo(
        () => [
            { index: 1, label: 'Tester' },
            { index: 2, label: 'Flows' },
        ],
        [],
    )

    function updateView(flow: FlowVariant, next: ViewState): void {
        setViews(prev => ({ ...prev, [flow]: next }))
    }

    function handleRunFull(): void {
        updateView(activeFlow, 'runFull')
    }

    function handleRunToStep(): void {
        const hasStep = runSteps.some(step => step.id === toStepState[activeFlow])
        const nextStep = hasStep ? toStepState[activeFlow] : flowDefinition.defaultToStep
        setToStepState(prev => ({ ...prev, [activeFlow]: nextStep }))
        updateView(activeFlow, 'runToStep')
    }

    async function handleConfigSaved(updatedConfig: FlowConfigUnion): Promise<void> {
        updateFlowConfig(activeFlow, updatedConfig)
        updateView(activeFlow, 'home')
    }

    function handleFlowTabClick(event: MouseEvent<HTMLButtonElement>): void {
        const nextFlow = event.currentTarget.dataset.flowKey
        if (!nextFlow) {
            return
        }

        setActiveFlow(nextFlow as FlowVariant)
    }

    function handleEditConfig(): void {
        updateView(activeFlow, 'edit')
    }

    function handleCancelEdit(): void {
        updateView(activeFlow, 'home')
    }

    function handleToStepChange(event: ChangeEvent<HTMLSelectElement>): void {
        setToStepState(prev => ({
            ...prev,
            [activeFlow]: event.currentTarget.value,
        }))
    }

    if (!isConfigLoaded) {
        return (
            <PageWrapper pageTitle='Tester' breadCrumb={breadcrumb} className={styles.page}>
                <div className={styles.loadingCard}>Loading configuration...</div>
            </PageWrapper>
        )
    }

    return (
        <PageWrapper pageTitle='Tester' breadCrumb={breadcrumb} className={styles.page}>
            <div className={styles.flowTabs}>
                {ORDERED_FLOW_KEYS.map(flowKey => {
                    const definition = FLOW_DEFINITIONS[flowKey]
                    const isActive = flowKey === activeFlow
                    const palette = FLOW_PALETTE[flowKey]

                    return (
                        <button
                            type='button'
                            key={flowKey}
                            data-flow-key={flowKey}
                            className={classNames(styles.flowTab, {
                                [styles['flowTab--active']]: isActive,
                            })}
                            style={{
                                backgroundColor: isActive ? palette.base : palette.soft,
                                borderColor: palette.base,
                                color: isActive ? '#FFFFFF' : palette.base,
                            }}
                            aria-pressed={isActive}
                            onClick={handleFlowTabClick}
                        >
                            {definition.tabLabel}
                        </button>
                    )
                })}
            </div>

            <div className={styles.section}>
                <ConfigTable flow={activeFlow} config={flowConfig} />
            </div>

            <div className={styles.section}>
                <div className={styles.actionsCard}>
                    <h3>Actions</h3>
                    <div className={styles.buttonGroup}>
                        <button type='button' className='filledButton' onClick={handleRunFull}>
                            Run the full flow
                        </button>
                        <button type='button' className='filledButton' onClick={handleRunToStep}>
                            Run to a specific step
                        </button>
                        <button
                            type='button'
                            className='borderButton'
                            onClick={handleEditConfig}
                        >
                            Edit configuration
                        </button>
                    </div>
                </div>
            </div>

            {currentView === 'edit' ? (
                <div className={classNames(styles.section, styles.formWrapper)}>
                    <ConfigForm
                        flow={activeFlow}
                        config={flowConfig}
                        onSave={handleConfigSaved}
                        onCancel={handleCancelEdit}
                    />
                </div>
            ) : undefined}

            {currentView === 'runToStep' ? (
                <div className={styles.section}>
                    <div className={styles.actionsCard}>
                        <label className={styles.label}>Step</label>
                        <select
                            className={styles.stepSelector}
                            value={currentToStep}
                            onChange={handleToStepChange}
                        >
                            {runSteps.map(step => (
                                <option key={step.id} value={step.id}>
                                    {step.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            ) : undefined}

            {showRunner ? (
                <div className={styles.section}>
                    <Runner
                        flow={activeFlow}
                        mode={currentView === 'runFull' ? 'full' : 'toStep'}
                        toStep={currentView === 'runToStep' ? currentToStep : undefined}
                    />
                </div>
            ) : undefined}
        </PageWrapper>
    )
}

export default FlowsPage
