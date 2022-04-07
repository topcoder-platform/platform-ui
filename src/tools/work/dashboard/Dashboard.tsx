import { FC } from 'react'
import { Link } from 'react-router-dom'

const Dashboard: FC<{}> = () => {
    return (
        <>
            <h2>
                Dashboard
            </h2>
            <div>
                <Link to='create'>
                    Create Data Exploration
                </Link>
            </div>
        </>
    )
}

export default Dashboard
