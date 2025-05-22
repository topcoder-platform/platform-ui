/* eslint-disable react/jsx-wrap-multilines */
import { FC, useEffect, useState } from 'react'

import { UserProfile } from '~/libs/core'
import { IconOutline, LinkButton, LoadingCircles } from '~/libs/ui'

import { Balance } from '../../../lib/models/WalletDetails'
import { InfoRow, PayoutGuard } from '../../../lib'
import { BannerImage, BannerText } from '../../../lib/assets/home'
import { nullToZero } from '../../../lib/util'
import { useWalletDetails, WalletDetailsResponse } from '../../../lib/hooks/use-wallet-details'
import Chip from '../../../lib/components/chip/Chip'

import styles from './Home.module.scss'

interface HomeTabProps {
    profile: UserProfile
}

const HomeTab: FC<HomeTabProps> = props => {

    const { data: walletDetails, isLoading, error }: WalletDetailsResponse = useWalletDetails()
    const [balanceSum, setBalanceSum] = useState(0)

    useEffect(() => {
        if (walletDetails) {
            setBalanceSum(
                walletDetails.account.balances.reduce((sum: number, balance: Balance) => sum + balance.amount, 0),
            )
        }
    }, [walletDetails])

    if (error) {
        return <div>{error}</div>
    }

    return (
        <div className={styles.container}>
            <div className={styles.banner}>
                <BannerText />
                <BannerImage />
            </div>
            {isLoading && <LoadingCircles />}
            {!isLoading && walletDetails && (
                <div className={styles['info-row-container']}>
                    <InfoRow
                        title='Account Balance'
                        value={`$${balanceSum}`}
                        action={
                            <LinkButton
                                label='MANAGE YOUR WINNINGS'
                                iconToRight
                                icon={IconOutline.ArrowRightIcon}
                                size='md'
                                link
                                to='#winnings'
                            />
                        }
                    />

                    <PayoutGuard profile={props.profile}>
                        {walletDetails.withdrawalMethod.isSetupComplete && walletDetails.taxForm.isSetupComplete && (
                            <InfoRow
                                title='Est. Payment Fees and Tax Withholding %'
                                // eslint-disable-next-line max-len
                                value={`Fee: ${nullToZero(walletDetails.estimatedFees)} USD / Tax Withholding: ${nullToZero(walletDetails.taxWithholdingPercentage)}%`}
                                action={
                                    <LinkButton
                                        label='ADJUST YOUR PAYOUT SETTINGS'
                                        iconToRight
                                        icon={IconOutline.ArrowRightIcon}
                                        size='md'
                                        link
                                        to='#payout'
                                    />
                                }
                            />
                        )}

                        {!walletDetails?.withdrawalMethod.isSetupComplete && (
                            <InfoRow
                                title='Withdrawal Method'
                                value={
                                    walletDetails?.withdrawalMethod.isSetupComplete ? (
                                        'Your preferred method'
                                    ) : (
                                        <Chip text='Setup Required' />
                                    )
                                }
                                action={
                                    <LinkButton
                                        label='SETUP WITHDRAWAL METHOD'
                                        iconToRight
                                        icon={IconOutline.ArrowRightIcon}
                                        size='md'
                                        link
                                        to='#payout'
                                    />
                                }
                            />
                        )}

                        {!walletDetails?.taxForm.isSetupComplete && (
                            <InfoRow
                                title='Tax Form'
                                value={walletDetails?.taxForm.isSetupComplete ? 'All set' : <Chip text='Setup Required' />}
                                action={
                                    <LinkButton
                                        label='COMPLETE TAX FORM'
                                        iconToRight
                                        icon={IconOutline.ArrowRightIcon}
                                        size='md'
                                        link
                                        to='#payout'
                                    />
                                }
                            />
                        )}
                    </PayoutGuard>
                </div>
            )}
        </div>
    )
}

export default HomeTab
