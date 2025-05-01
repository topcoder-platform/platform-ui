/* eslint-disable react/jsx-wrap-multilines */
import { FC, useEffect, useState } from 'react'

import { UserProfile } from '~/libs/core'
import { IconOutline, LinkButton, LoadingCircles } from '~/libs/ui'

import { Balance, WalletDetails } from '../../../lib/models/WalletDetails'
import { getWalletDetails } from '../../../lib/services/wallet'
import { InfoRow } from '../../../lib'
import { BannerImage, BannerText } from '../../../lib/assets/home'
import Chip from '../../../lib/components/chip/Chip'

import styles from './Home.module.scss'

interface HomeTabProps {
    profile: UserProfile
}

const HomeTab: FC<HomeTabProps> = () => {
    const [walletDetails, setWalletDetails] = useState<WalletDetails | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(false)
    const [balanceSum, setBalanceSum] = useState(0)
    const [error, setError] = useState<string | undefined>(undefined)

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        const fetchWalletDetails = async () => {
            setIsLoading(true)
            try {
                const details = await getWalletDetails()
                setWalletDetails(details)
            } catch (apiError) {
                setError('Error fetching wallet details')
            }

            setIsLoading(false)
        }

        fetchWalletDetails()
    }, [])

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
            {!isLoading && (
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
                </div>
            )}
        </div>
    )
}

export default HomeTab
