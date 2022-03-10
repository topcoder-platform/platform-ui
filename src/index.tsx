import { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'

import { default as App } from './App'
import './index.scss'
import { RouteProvider } from './lib'
import reportWebVitals from './reportWebVitals'

ReactDOM.render(
    <BrowserRouter>
        <RouteProvider>
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
