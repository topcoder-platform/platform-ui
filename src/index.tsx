import { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'

import { default as App } from './App'
import { EnvironmentConfig } from './config'
import './index.scss'
import { RouteProvider } from './lib'
import reportWebVitals from './reportWebVitals'
import { ToolsRoutes } from './tools'
import { UtilsRoutes } from './utils'

ReactDOM.render(
    <BrowserRouter>
        <RouteProvider
            config={EnvironmentConfig}
            toolsRoutes={[...ToolsRoutes]}
            utilsRoutes={[...UtilsRoutes]}
        >
            <StrictMode>
                <App />
            </StrictMode>
        </RouteProvider>
    </BrowserRouter>,
    document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
