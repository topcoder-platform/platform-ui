/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable unicorn/no-null */
import { useNavigate } from 'react-router-dom'
import { connect } from 'react-redux'
import { FC, useState } from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import { Button, PageDivider } from '~/libs/ui'

import { ProgressBar } from '../../components/progress-bar'

import styles from './styles.module.scss'
import AccountDetailInfo from '../../models/AccountDetailInfo'

const PageAccountDetailsContent: FC<{
}> = props => {
    const navigate: any = useNavigate()
    const [loading, setLoading] = useState<boolean>(false)
    const [accountDetailInfo, setAccountDetailInfo] = useState<AccountDetailInfo | null>(null)

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <h2>Final account details</h2>
            <PageDivider />
            <div className={classNames(styles.blockContent, 'd-flex flex-column')}>
                <h3>Account mailing address</h3>
            </div>

            <ProgressBar
                className={styles.ProgressBar}
                progress={6.0 / 7}
                label='6/7'
            />

            <div className={classNames('d-flex justify-content-between', styles.blockFooter)}>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={loading}
                    onClick={() => navigate('../personalization')}
                >
                    back
                </Button>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={loading}
                >
                    next
                </Button>
            </div>
        </div>
    )
}

const mapStateToProps: any = (state: any) => {
}

const mapDispatchToProps: any = {
}

export const PageAccountDetails: any = connect(mapStateToProps, mapDispatchToProps)(PageAccountDetailsContent)

export default PageAccountDetails
