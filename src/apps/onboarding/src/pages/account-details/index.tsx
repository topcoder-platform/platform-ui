/* eslint-disable ordered-imports/ordered-imports */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable unicorn/no-null */
/* eslint-disable sort-keys */
import { useNavigate } from 'react-router-dom'
import { connect } from 'react-redux'
import { FC, MutableRefObject, useEffect, useRef, useState } from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import { Button, InputSelect, PageDivider } from '~/libs/ui'
import { getCountryLookup } from '~/libs/core/lib/profile/profile-functions/profile-store/profile-xhr.store'
import { EnvironmentConfig } from '~/config'
import { Member } from '~/apps/talent-search/src/lib/models'

import { ProgressBar } from '../../components/progress-bar'

import styles from './styles.module.scss'
import InputTextAutoSave from '../../components/InputTextAutoSave'
import { validatePhonenumber } from '../../utils/validation'
import {
    createMemberConnectInfos,
    updateMemberConnectInfos,
    updateMemberHomeAddresss,
} from '../../redux/actions/member'
import MemberAddress, { emptyMemberAddress } from '../../models/MemberAddress'
import ConnectInfo, { emptyConnectInfo } from '../../models/ConnectInfo'

const blankMemberAddress: MemberAddress = emptyMemberAddress()
const blankConnectInfo: ConnectInfo = emptyConnectInfo()

const PageAccountDetailsContent: FC<{
    reduxAddress: MemberAddress | null
    reduxConnectInfo: ConnectInfo | null
    reduxMemberInfo: Member | null
    updateMemberConnectInfos: (infos: ConnectInfo[]) => void
    createMemberConnectInfos: (infos: ConnectInfo[]) => void
    updateMemberHomeAddresss: (infos: MemberAddress[]) => void
    loadingMemberInfo: boolean
    loadingMemberTraits: boolean
}> = props => {
    const navigate: any = useNavigate()
    const [loadingAddress, setLoadingAddress] = useState<boolean>(false)
    const [loadingConnectInfo, setLoadingConnectInfo] = useState<boolean>(false)
    const [memberAddress, setMemberAddress] = useState<MemberAddress | null>(null)
    const [connectInfo, setConnectInfo] = useState<ConnectInfo | null>(null)
    const [formErrors, setFormErrors] = useState<any>({})
    const [countryOptions, setCountryOptions] = useState<{
        label: string
        value: string
    }[]>([])
    const shouldSavingAddressData: MutableRefObject<boolean> = useRef<boolean>(false)
    const shouldSavingConnectInfoData: MutableRefObject<boolean> = useRef<boolean>(false)
    const shouldNavigateTo: MutableRefObject<string> = useRef<string>('')

    const validateField: any = () => {
        const errorTmp: any = {}
        if (!validatePhonenumber(connectInfo?.phoneNumber || '')) {
            errorTmp.phoneNumber = 'Invalid phone number'
        }

        setFormErrors(errorTmp)
        return _.isEmpty(errorTmp)
    }

    const saveConnectInfoData: any = async () => {
        if (!connectInfo || !validateField()) {
            return
        }

        setLoadingConnectInfo(true)
        if (!props.reduxConnectInfo) {
            await props.createMemberConnectInfos([connectInfo])
        } else {
            await props.updateMemberConnectInfos([connectInfo])
        }

        setLoadingConnectInfo(false)
    }

    useEffect(() => {
        if (!!connectInfo && validateField() && !_.isEqual(props.reduxConnectInfo, connectInfo)) {
            if (loadingConnectInfo) {
                shouldSavingConnectInfoData.current = true
                return
            }

            saveConnectInfoData()
                .then(_.noop)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [connectInfo])

    const saveAddressData: any = async () => {
        if (!memberAddress) {
            return
        }

        setLoadingAddress(true)
        await props.updateMemberHomeAddresss([memberAddress])

        setLoadingAddress(false)
    }

    useEffect(() => {
        if (!!memberAddress && !_.isEqual(props.reduxAddress, memberAddress)) {
            if (loadingAddress) {
                shouldSavingAddressData.current = true
                return
            }

            saveAddressData()
                .then(_.noop)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [memberAddress])

    useEffect(() => {
        const doSaveAddress: boolean = !loadingAddress && shouldSavingAddressData.current
        if (doSaveAddress) {
            shouldSavingAddressData.current = false
            saveAddressData()
                .then(_.noop)
        }

        const doSaveConnectData: boolean = !loadingConnectInfo && shouldSavingConnectInfoData.current
        if (doSaveConnectData) {
            shouldSavingConnectInfoData.current = false
            saveConnectInfoData()
                .then(_.noop)
        }

        if (
            !shouldSavingAddressData.current
            && !shouldSavingConnectInfoData.current
            && !loadingAddress
            && !loadingConnectInfo
            && shouldNavigateTo.current) {
            if (shouldNavigateTo.current.startsWith('../')) {
                navigate(shouldNavigateTo.current)
            } else {
                window.location.href = shouldNavigateTo.current
            }
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [loadingAddress, loadingConnectInfo])

    // Get all countries
    useEffect(() => {
        getCountryLookup()
            .then(results => {
                if (results) {
                    setCountryOptions(_.sortBy(results, 'country')
                        .map((country: any) => ({
                            value: country.country,
                            label: country.country,
                        })))
                }
            })
            .catch(_.noop)
    }, [])

    useEffect(() => {
        if (!memberAddress && props.reduxAddress) {
            setMemberAddress(props.reduxAddress)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [props.reduxAddress])

    useEffect(() => {
        if (!connectInfo && props.reduxConnectInfo) {
            setConnectInfo(props.reduxConnectInfo)
        }
        /* eslint-disable react-hooks/exhaustive-deps */
    }, [props.reduxConnectInfo])

    return (
        <div className={classNames('d-flex flex-column', styles.container)}>
            <h2>Final account details</h2>
            <PageDivider />
            <div className={classNames(styles.blockContent, 'd-flex flex-column gap-20')}>
                <h3>Account mailing address</h3>
                <span>
                    Your mailing address is required for account activation and verification to do work with Topcoder or
                    Topcoder customers. This information
                    <strong> will not </strong>
                    be displayed on your profile nor to anyone visiting the Topcoder site.
                </span>

                <InputTextAutoSave
                    name='streetAddr1'
                    label='Address 1'
                    value={memberAddress?.streetAddr1 || ''}
                    onChange={event => {
                        setMemberAddress({
                            ...(memberAddress || blankMemberAddress),
                            streetAddr1: event || '',
                        })
                    }}
                    placeholder='Address 1'
                    tabIndex={0}
                    type='text'
                    disabled={props.loadingMemberInfo}
                />
                <InputTextAutoSave
                    name='streetAddr2'
                    label='Address 2'
                    value={memberAddress?.streetAddr2 || ''}
                    onChange={event => {
                        setMemberAddress({
                            ...(memberAddress || blankMemberAddress),
                            streetAddr2: event || '',
                        })
                    }}
                    placeholder='Address 2'
                    tabIndex={0}
                    type='text'
                    disabled={props.loadingMemberInfo}
                />
                <div className='d-flex full-width gap-20'>
                    <div
                        className='flex-1'
                    >
                        <InputTextAutoSave
                            name='city'
                            label='City'
                            value={memberAddress?.city || ''}
                            onChange={event => {
                                setMemberAddress({
                                    ...(memberAddress || blankMemberAddress),
                                    city: event || '',
                                })
                            }}
                            placeholder='City'
                            tabIndex={0}
                            type='text'
                            disabled={props.loadingMemberInfo}
                        />
                    </div>
                    <div
                        className='flex-1'
                    >
                        <InputTextAutoSave
                            name='stateCode'
                            label='State / Province'
                            value={memberAddress?.stateCode || ''}
                            onChange={event => {
                                setMemberAddress({
                                    ...(memberAddress || blankMemberAddress),
                                    stateCode: event || '',
                                })
                            }}
                            placeholder='State / Province'
                            tabIndex={0}
                            type='text'
                            className='flex-1'
                            disabled={props.loadingMemberInfo}
                        />
                    </div>
                    <div
                        className='flex-1'
                    >
                        <InputTextAutoSave
                            name='zip'
                            label='Zip / Postal Code'
                            value={memberAddress?.zip || ''}
                            onChange={event => {
                                setMemberAddress({
                                    ...(memberAddress || blankMemberAddress),
                                    zip: event || '',
                                })
                            }}
                            placeholder='Zip / Postal Code'
                            tabIndex={0}
                            type='text'
                            className='flex-1'
                            disabled={props.loadingMemberInfo}
                        />
                    </div>
                </div>
                <InputSelect
                    options={countryOptions}
                    value={connectInfo?.country || ''}
                    onChange={event => {
                        setConnectInfo({
                            ...(connectInfo || blankConnectInfo),
                            country: event.target.value,
                        })
                    }}
                    name='country'
                    label='Country'
                    placeholder='Country'
                    disabled={props.loadingMemberTraits}
                />
                <h3>Valid mobile phone number</h3>
                <span>
                    Your phone number may be necessary to validate your account and verify your identity.
                    Topcoder will not share this information with any other parties or use this to contact
                    you for any other reason. It will not display on your public profile nor to anyone
                    visiting the Topcoder site.
                </span>
                <InputTextAutoSave
                    name='phoneNumber'
                    label='Phone Number'
                    value={connectInfo?.phoneNumber || ''}
                    onChange={event => {
                        setConnectInfo({
                            ...(connectInfo || blankConnectInfo),
                            phoneNumber: event || '',
                        })
                    }}
                    placeholder='Phone Number'
                    tabIndex={0}
                    type='text'
                    dirty
                    error={formErrors.phoneNumber}
                    disabled={props.loadingMemberTraits}
                />
            </div>

            <ProgressBar
                className={styles.ProgressBar}
                progress={6.0 / 6}
                label='6/6'
            />

            <div className={classNames('d-flex justify-content-between', styles.blockFooter)}>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={!_.isEmpty(formErrors)}
                    onClick={() => {
                        if (loadingAddress || loadingConnectInfo) {
                            shouldNavigateTo.current = '../personalization'
                        } else {
                            navigate('../personalization')
                        }
                    }}
                >
                    back
                </Button>
                <Button
                    size='lg'
                    primary
                    iconToLeft
                    disabled={!_.isEmpty(formErrors) || !props.reduxMemberInfo}
                    onClick={() => {
                        if (loadingAddress || loadingConnectInfo) {
                            shouldNavigateTo.current
                                = `${EnvironmentConfig.USER_PROFILE_URL}/${props.reduxMemberInfo?.handle}`
                        } else {
                            window.location.href
                                = `${EnvironmentConfig.USER_PROFILE_URL}/${props.reduxMemberInfo?.handle}`
                        }
                    }}
                >
                    next
                </Button>
            </div>
        </div>
    )
}

const mapStateToProps: any = (state: any) => {
    const {
        loadingMemberTraits,
        loadingMemberInfo,
        address,
        connectInfo,
        memberInfo,
    }: any = state.member

    return {
        loadingMemberInfo,
        loadingMemberTraits,
        reduxAddress: address,
        reduxConnectInfo: connectInfo,
        reduxMemberInfo: memberInfo,
    }
}

const mapDispatchToProps: any = {
    updateMemberHomeAddresss,
    updateMemberConnectInfos,
    createMemberConnectInfos,
}

export const PageAccountDetails: any = connect(mapStateToProps, mapDispatchToProps)(PageAccountDetailsContent)

export default PageAccountDetails
