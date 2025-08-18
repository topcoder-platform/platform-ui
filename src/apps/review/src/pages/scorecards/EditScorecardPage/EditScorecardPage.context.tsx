import { createContext, ReactNode, useContext } from 'react';
import { ConfirmationProps, useConfirmationModal } from '~/libs/ui';

export interface EditScorecardPageContextProps {
  children: ReactNode;
}

export type EditScorecardPageContextValue = {
    confirm: (prosp: ConfirmationProps) => Promise<boolean>,
};

const EditScorecardPageContext = createContext({} as EditScorecardPageContextValue);


export function EditScorecardPageContextProvider({
  children,
  ...props
}: EditScorecardPageContextProps) {
    const confirmation = useConfirmationModal()

  return (
    <EditScorecardPageContext.Provider
      value={{
        confirm: confirmation.confirm,
      }}
      {...props}
    >
      {children}
      {confirmation.modal}
    </EditScorecardPageContext.Provider>
  );
};

export const usePageContext = () => useContext(EditScorecardPageContext);
