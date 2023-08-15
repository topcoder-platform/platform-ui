import { createContext, FC, ReactNode, useContext, useMemo, useState } from 'react'

export interface ConfigContextValue {
    logoutUrl: string
    setLogoutUrl: (logoutUrl: string) => void
}

const ConfigReactCtx = createContext<ConfigContextValue>({} as ConfigContextValue)

interface ConfigContextProps {
    children?: ReactNode
    logoutUrl: string
}

export const ConfigContextProvider: FC<ConfigContextProps> = props => {
    const [logoutUrl, setLogoutUrl] = useState<string>(props.logoutUrl)

    const contextValue = useMemo(() => ({
        logoutUrl,
        setLogoutUrl,
    }), [setLogoutUrl, logoutUrl])

    return (
        <ConfigReactCtx.Provider
            value={contextValue}
        >
            {props.children}
        </ConfigReactCtx.Provider>
    )
}

export const useConfigContext = (): ConfigContextValue => (
    useContext(ConfigReactCtx)
)
