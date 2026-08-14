import { FC, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button, ContentLayout, IconOutline, IconSolid, PageTitle } from '~/libs/ui'

import styles from './MemberNotFound.module.scss'

interface MemberNotFoundProps {
    memberHandle?: string
}

const MemberNotFound: FC<MemberNotFoundProps> = (props: MemberNotFoundProps) => {
    const navigate = useNavigate()

    const handleBack = useCallback(() => {
        navigate(-1)
    }, [navigate])

    return (
        <ContentLayout outerClass={styles.container}>
            <PageTitle>Profile Not Found | Topcoder</PageTitle>

            <div className={styles.content} role='alert'>
                <IconOutline.ExclamationCircleIcon className='icon-xxxl' />
                <h2 className={styles.title}>We were unable to locate that profile</h2>
                {props.memberHandle && (
                    <p className='body-main'>
                        No member was found with the handle
                        {' '}
                        <strong>{props.memberHandle}</strong>
                        .
                    </p>
                )}
                <Button
                    link
                    size='lg'
                    iconToLeft
                    icon={IconSolid.ArrowLeftIcon}
                    onClick={handleBack}
                >
                    Go back
                </Button>
            </div>
        </ContentLayout>
    )
}

export default MemberNotFound
