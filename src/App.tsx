import { BrowserRouter } from 'react-router-dom'

// TODO: import styles from './App.scss'
import Header from './header/Header'

const App: () => JSX.Element = () => {
    return (
        <>
            <BrowserRouter>
                <Header />
            </BrowserRouter>
        </>
    )
}

export default App
