/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
import React, { FC } from 'react'

import { Button } from '~/libs/ui'

const ConnectLinkedIn: FC<{}> = () => (
    <div className='d-flex flex-column align-items-end'>
        <span>Wait! Get my skills from LinkedIn instead...</span>
        <Button
            size='lg'
            secondary
            iconToLeft
            className='mt-30'
        >
            connect to linked in
        </Button>
    </div>
)

export default ConnectLinkedIn
