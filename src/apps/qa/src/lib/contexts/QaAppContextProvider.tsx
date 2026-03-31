/**
 * Context provider for QA app.
 */
import {
    Context,
    createContext,
    FC,
    PropsWithChildren,
} from 'react'

export type QaAppContextModel = Record<string, never>

const defaultQaAppContext: QaAppContextModel = {}

export const QaAppContext: Context<QaAppContextModel>
    = createContext<QaAppContextModel>(defaultQaAppContext)

/**
 * Provides the QA app context to child routes.
 */
export const QaAppContextProvider: FC<PropsWithChildren> = props => (
    <QaAppContext.Provider value={defaultQaAppContext}>
        {props.children}
    </QaAppContext.Provider>
)
