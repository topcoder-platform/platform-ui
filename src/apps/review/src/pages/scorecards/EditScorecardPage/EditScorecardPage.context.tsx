import { omit } from 'lodash'
import { createContext, ReactNode, useContext, useMemo } from 'react'

import { ConfirmationProps, useConfirmationModal } from '~/libs/ui'

export interface EditScorecardPageContextProps {
  children: ReactNode;
}

export type EditScorecardPageContextValue = {
    confirm: (prosp: ConfirmationProps) => Promise<boolean>,
};

const EditScorecardPageContext = createContext({} as EditScorecardPageContextValue)

export const EditScorecardPageContextProvider = (props: EditScorecardPageContextProps): JSX.Element => {
    const confirmation = useConfirmationModal()

    const ctxVal = useMemo(() => ({
        confirm: confirmation.confirm,
    }), [confirmation])

    return (
        <EditScorecardPageContext.Provider
            value={ctxVal}
            {...omit(props, 'children')}
        >
            {props.children}
            {confirmation.modal}
        </EditScorecardPageContext.Provider>
    )
}

export const usePageContext = (): EditScorecardPageContextValue => useContext(EditScorecardPageContext)
