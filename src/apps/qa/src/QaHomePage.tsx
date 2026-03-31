/* eslint-disable ordered-imports/ordered-imports, react/jsx-no-bind, sort-keys, unicorn/no-null */
import { FC, useEffect, useMemo, useState } from 'react'

import { LoadingSpinner, PageTitle } from '~/libs/ui'

import ConfigForm from './ConfigForm'
import ConfigTable from './ConfigTable'
import {
    createInitialToStepState,
    createInitialViewState,
    FLOW_DEFINITIONS,
    FLOW_THEME_BY_VARIANT,
    getFlowConfig,
    ORDERED_FLOW_KEYS,
} from './flows'
import Runner from './Runner'
import { fetchAppConfigAsync } from './service'
import type {
    AppConfig,
    FlowVariant,
    ViewState,
} from './types'

const pageTitle = 'QA Flow Tester'

/**
 * Renders the migrated QA tester home page inside platform-ui.
 */
const QaHomePage: FC = () => {
    const [config, setConfig] = useState<AppConfig | null>(null)
    const [configError, setConfigError] = useState<string | null>(null)
    const [isConfigLoading, setIsConfigLoading] = useState(true)
    const [views, setViews] = useState<Record<FlowVariant, ViewState>>(
        () => createInitialViewState(),
    )
    const [toStepState, setToStepState] = useState<Record<FlowVariant, string>>(
        () => createInitialToStepState(),
    )
    const [activeFlow, setActiveFlow] = useState<FlowVariant>('full')

    useEffect(() => {
        let isMounted = true

        const loadConfig = async (): Promise<void> => {
            try {
                setIsConfigLoading(true)
                setConfigError(null)
                const nextConfig = await fetchAppConfigAsync()

                if (!isMounted) {
                    return
                }

                setConfig(nextConfig)
            } catch {
                if (!isMounted) {
                    return
                }

                setConfig(null)
                setConfigError('Failed to load QA configuration.')
            } finally {
                if (isMounted) {
                    setIsConfigLoading(false)
                }
            }
        }

        loadConfig()

        return () => {
            isMounted = false
        }
    }, [])

    const currentView = views[activeFlow]
    const flowDefinition = FLOW_DEFINITIONS[activeFlow]
    const flowTheme = FLOW_THEME_BY_VARIANT[activeFlow]
    const currentToStep = toStepState[activeFlow]
    const flowConfig = useMemo(
        () => (config ? getFlowConfig(config, activeFlow) : null),
        [activeFlow, config],
    )
    const showRunner = currentView === 'runFull' || currentView === 'runToStep'

    useEffect(() => {
        const root = document.documentElement
        root.style.setProperty('--qa-accent-color', flowTheme.accent)
        root.style.setProperty('--qa-accent-color-soft', flowTheme.accentSoft)
        root.style.setProperty('--qa-accent-color-strong', flowTheme.accentStrong)

        return () => {
            root.style.setProperty('--qa-accent-color', '#2563eb')
            root.style.setProperty('--qa-accent-color-soft', '#dbeafe')
            root.style.setProperty('--qa-accent-color-strong', '#1d4ed8')
        }
    }, [flowTheme])

    if (isConfigLoading) {
        return (
            <div className='qa-home-page'>
                <PageTitle>{pageTitle}</PageTitle>
                <div className='qa-card'>
                    <LoadingSpinner inline message='Loading QA configuration…' />
                </div>
            </div>
        )
    }

    if (configError || !config || !flowConfig) {
        return (
            <div className='qa-home-page'>
                <PageTitle>{pageTitle}</PageTitle>
                <div className='qa-card'>
                    <div className='qa-inline-note qa-status-text'>
                        {configError || 'Failed to load QA configuration.'}
                    </div>
                </div>
            </div>
        )
    }

    const updateView = (flow: FlowVariant, nextView: ViewState): void => {
        setViews(previous => ({
            ...previous,
            [flow]: nextView,
        }))
    }

    const handleRunFull = (): void => {
        updateView(activeFlow, 'runFull')
    }

    const handleRunToStep = (): void => {
        const hasStep = flowDefinition.steps.some(step => step.id === toStepState[activeFlow])
        const nextStep = hasStep ? toStepState[activeFlow] : flowDefinition.defaultToStep
        setToStepState(previous => ({
            ...previous,
            [activeFlow]: nextStep,
        }))
        updateView(activeFlow, 'runToStep')
    }

    const handleConfigSaved = (nextConfig: AppConfig): void => {
        setConfig(nextConfig)
        updateView(activeFlow, 'home')
    }

    return (
        <div className='qa-home-page'>
            <PageTitle>{pageTitle}</PageTitle>

            <section
                className='qa-card'
                style={{
                    borderColor: flowTheme.accentSoft,
                    boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 16,
                        flexWrap: 'wrap',
                        alignItems: 'flex-start',
                    }}
                >
                    <div style={{ maxWidth: 720 }}>
                        <div className='qa-eyebrow'>Platform UI QA</div>
                        <h1 style={{ margin: '8px 0 12px', fontSize: '2rem', lineHeight: 1.1 }}>
                            QA flow runner migration
                        </h1>
                        <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>
                            The legacy autopilot tester is now available inside platform-ui. Select a flow,
                            inspect the persisted config, run the full orchestration or stop at a specific
                            step, then review snapshots, reviews, and captured API calls from one screen.
                        </p>
                    </div>
                    <div className='qa-badge'>
                        {flowDefinition.tabLabel}
                    </div>
                </div>
            </section>

            <section className='qa-card'>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(220px, 320px) 1fr',
                        gap: 16,
                        alignItems: 'end',
                    }}
                >
                    <label className='qa-field'>
                        <span>Flow</span>
                        <select
                            value={activeFlow}
                            onChange={event => setActiveFlow(event.target.value as FlowVariant)}
                        >
                            {ORDERED_FLOW_KEYS.map(flowKey => (
                                <option key={flowKey} value={flowKey}>
                                    {FLOW_DEFINITIONS[flowKey].tabLabel}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className='qa-inline-note'>
                        The migrated QA app preserves snapshots, review refreshes, stream reconnects,
                        request inspection, run-to-step execution, and success or failure surfacing for the
                        selected flow.
                    </div>
                </div>
            </section>

            <ConfigTable flow={activeFlow} config={flowConfig} />

            <section className='qa-card'>
                <h3 style={{ marginTop: 0 }}>Actions</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type='button' onClick={handleRunFull} className='qa-primary-button'>
                        Run the full flow
                    </button>
                    <button type='button' onClick={handleRunToStep} className='qa-secondary-button'>
                        Run to a specific step
                    </button>
                    <button
                        type='button'
                        onClick={() => updateView(activeFlow, 'edit')}
                        className='qa-secondary-button'
                    >
                        Edit configuration
                    </button>
                </div>
            </section>

            {currentView === 'edit' ? (
                <ConfigForm
                    flow={activeFlow}
                    config={config}
                    onSaved={handleConfigSaved}
                />
            ) : null}

            {currentView === 'runToStep' ? (
                <section className='qa-card'>
                    <label className='qa-field qa-field--compact'>
                        <span>Step</span>
                        <select
                            value={currentToStep}
                            onChange={event => setToStepState(previous => ({
                                ...previous,
                                [activeFlow]: event.target.value,
                            }))}
                        >
                            {flowDefinition.steps.map(step => (
                                <option key={step.id} value={step.id}>{step.label}</option>
                            ))}
                        </select>
                    </label>
                </section>
            ) : null}

            {showRunner ? (
                <Runner
                    flow={activeFlow}
                    mode={currentView === 'runFull' ? 'full' : 'toStep'}
                    toStep={currentView === 'runToStep' ? currentToStep : undefined}
                />
            ) : null}
        </div>
    )
}

export default QaHomePage
