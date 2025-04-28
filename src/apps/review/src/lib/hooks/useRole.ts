import { useState } from 'react'

import { SUBMITTER } from '../../config/index.config'

const useRole = (): {role: string, updateRole: (newState: string) => void} => {
    const [role, setRole] = useState(localStorage.getItem('role') || SUBMITTER)

    const updateRole = (newState: string):void => {
        localStorage.setItem('role', newState)
        setRole(newState)
    }

    return { role, updateRole }
}

export { useRole }
