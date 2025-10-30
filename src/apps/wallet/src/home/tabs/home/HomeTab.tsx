/* eslint-disable react/jsx-wrap-multilines */
import { FC, useMemo } from 'react'

import { UserProfile } from '~/libs/core'
import { IconOutline, LinkButton, LoadingCircles } from '~/libs/ui'

import { InfoRow, PayoutGuard } from '../../../lib'
import { BannerImage, BannerText } from '../../../lib/assets/home'
import { nullToZero } from '../../../lib/util'
import { useWalletDetails, WalletDetailsResponse } from '../../../lib/hooks/use-wallet-details'
import Chip from '../../../lib/components/chip/Chip'

import styles from './Home.module.scss'

interface HomeTabProps {
    profile: UserProfile
}

type WalletDetailsData = NonNullable<WalletDetailsResponse['data']>
interface WalletInfoRowsProps {
    walletDetails: WalletDetailsData
    profile: UserProfile
    balanceSum: number
}

const WalletInfoRows: FC<WalletInfoRowsProps> = props => (
    <div className={styles['info-row-container']}>
        <InfoRow
            title='Account Balance'
            value={`$${props.balanceSum}`}
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
            {props.walletDetails.withdrawalMethod.isSetupComplete && (
                <InfoRow
                    title='Est. Payment Fees'
                    value={`$${nullToZero(props.walletDetails.estimatedFees)} USD`}
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
            {props.walletDetails.taxForm.isSetupComplete && (
                <InfoRow
                    title='Est. Tax Withholding %'
                    value={`${nullToZero(props.walletDetails.taxWithholdingPercentage)}%`}
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

            {!props.walletDetails.withdrawalMethod.isSetupComplete && (
                <InfoRow
                    title='Withdrawal Method'
                    value={<Chip text='Setup Required' />}
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

            {!props.walletDetails.taxForm.isSetupComplete && (
                <InfoRow
                    title='Tax Form'
                    value={<Chip text='Setup Required' />}
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
            {!props.walletDetails.identityVerification.isSetupComplete && (
                <InfoRow
                    title='ID Verification'
                    value={<Chip text='Setup Required' />}
                    action={
                        <LinkButton
                            label='COMPLETE VERIFICATION'
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
)

const HomeTab: FC<HomeTabProps> = props => {

    const { data: walletDetails, isLoading, error }: WalletDetailsResponse = useWalletDetails()

    const balanceSum = useMemo(
        () => (walletDetails ? walletDetails.account.balances.reduce((sum, balance) => sum + balance.amount, 0) : 0),
        [walletDetails],
    )

    if (error) {
        let errorMessage = 'Unable to load wallet details.'

        if (typeof error === 'string') {
            errorMessage = error
        } else if (error && typeof error === 'object' && 'message' in error) {
            errorMessage = (error as Error).message || errorMessage
        }

        return <div>{errorMessage}</div>
    }

    return (
        <div className={styles.container}>
            <div className={styles.banner}>
                <BannerText />
                <BannerImage />
            </div>
            {isLoading && <LoadingCircles />}
            {!isLoading && walletDetails && (
                <WalletInfoRows walletDetails={walletDetails} profile={props.profile} balanceSum={balanceSum} />
            )}
        </div>
    )
}

export default HomeTab
