import { FC } from 'react'

import { BaseModal } from '../base-modal'

import styles from './TermsModal.module.scss'

interface TermsModalProps {
    isOpen: boolean
    onClose: () => void
}

const TermsModal: FC<TermsModalProps> = ({ isOpen, onClose }: TermsModalProps) => (
    <BaseModal
        onClose={onClose}
        open={isOpen}
        size='lg'
        title='TOPCODER ONLINE CUSTOMER TERMS OF USE AGREEMENT'
    >
        <div className={styles.container}>
            <ol>
                <li>
                    <li>Date of Last Revision: Jan 27, 2022</li>
                    <br />
                    <li>
                        This User Agreement (the "<strong>Agreement</strong>") is a contract
                        between you (referred to herein as "User") and Topcoder LLC.
                        ("Topcoder") and applies to User's use and viewing of
                        <a href='https://www.topcoder.com/' target='_blank' rel='noreferrer'>
                            {' '}
                            topcoder.com
                        </a>
                        , related sub-domains (“Topcoder.com”). By visiting Topcoder.com, User
                        has accepted this Agreement and has agreed to be bound by the terms of
                        this Agreement. Topcoder may amend this Agreement at any time by
                        posting a revised version on Topcoder.com. The revised version will be
                        effective at the time Topcoder posts it.
                    </li>
                    <br />
                    <li>
                        <ol>
                            <li>
                                <h4>1.ACCOUNT</h4>
                            </li>
                            <li>
                                User may set up an account in connection with the use of
                                Topcoder.com. User may not use a third party's account without
                                permission. When setting up an account, User must supply accurate
                                and complete information. User is solely responsible for its
                                account and everything that happens on its account. User shall
                                protect its account log-in information and User shall report any
                                unauthorized use of its account to Topcoder immediately. User may
                                not transfer its account to any third party. Topcoder is not
                                liable for any damages or losses caused by someone using User's
                                account without User's permission.
                            </li>
                            <li>
                                <h4>2.PRIVACY</h4>
                            </li>
                            <li>
                                User agrees to comply with all terms of the Topcoder Privacy
                                Policy available at
                                <a href='https://www.topcoder.com/policy/privacy-policy/' target='_blank' rel='noreferrer'>
                                    {' '}
                                    https://www.topcoder.com/policy/privacy-policy/
                                </a>
                            </li>
                            <li>
                                <h4>3.GENERAL USE OF TOPCODER.COM.</h4>
                            </li>
                            <li>
                                Except as expressly authorized hereunder, Topcoder.com and content
                                therein may not be reproduced, duplicated, copied, sold, resold,
                                visited, reverse- engineered or otherwise exploited for any
                                commercial purpose without Topcoder's prior written authorization.
                                Topcoder reserves the right to alter or discontinue Topcoder.com,
                                in whole or in part, at any time in Topcoder's sole discretion.
                                Topcoder.com is not intended for use by children under the age of
                                13. Parental permission is required to use this Website if the
                                User has not reached the age of majority in the User's
                                jurisdiction of primary residence and citizenship. The User must
                                be at least 18 years old and have reached the age of majority in
                                such User's jurisdiction of primary residence and citizenship to
                                make any purchases from Topcoder.com. Subject to and conditioned
                                upon User's compliance with this Agreement, Topcoder grants User a
                                non-exclusive, non- transferable, limited right and license,
                                without right of sublicense, to access and use Topcoder.com,
                                including any images, text, graphics, sounds, data, links and
                                other materials incorporated therein solely as made available by
                                Topcoder and solely for User's own personal purposes. Except as
                                expressly authorized by this Agreement, User may not use,
                                reproduce, distribute, modify, transmit or publicly display any
                                portion of Topcoder.com or create derivative works of any portion
                                Topcoder.com without Topcoder's written consent. While using
                                Topcoder.com, User agrees not to:
                                <li>
                                    <br />
                                    <ul className={styles.a}>
                                        <li>
                                            Impersonate any person or entity or use any fraudulent,
                                            misleading or inaccurate email address or other contact
                                            information;
                                        </li>
                                        <li>
                                            Restrict or inhibit any other user from using Topcoder.com,
                                            including, without limitation, by means of "hacking" or
                                            defacing any portion of Topcoder.com;
                                        </li>
                                        <li>Violate any applicable laws or regulations;</li>
                                        <li>
                                            Upload to, transmit through, or display on Topcoder.com or
                                            via communications related to usage of the Site (a) any
                                            material that is unlawful, fraudulent, threatening, abusive,
                                            libelous, defamatory, obscene or otherwise objectionable, or
                                            infringes our or any third party's intellectual property or
                                            other rights; (b) any confidential, proprietary or trade
                                            secret information of any third party; or (c) any
                                            advertisements, solicitations, chain letters, pyramid
                                            schemes, investment opportunities or other unsolicited
                                            commercial communication (except as otherwise expressly
                                            permitted by us);
                                        </li>
                                        <li>Engage in spamming;</li>
                                        <li>
                                            Transmit any software or other materials that contain any
                                            viruses, worms, trojan horses, defects, or other destructive
                                            items;
                                        </li>
                                        <li>
                                            Modify, adapt, translate, distribute, reverse engineer,
                                            decompile or disassemble any portion of our Sites and Apps;
                                            and
                                        </li>
                                        <li>
                                            Remove any copyright, trademark or other proprietary rights
                                            notices contained in or displayed on any portion of
                                            Topcoder.com
                                        </li>
                                        <li>
                                            If User fails to comply with the above rules, such failure
                                            will constitute a violation of this Agreement, and, in
                                            addition to any other rights or remedies Topcoder may have,
                                            Topcoder may immediately terminate User's access to and use
                                            of Topcoder.com and related services.
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    <h4>4.GENERAL.</h4>
                                </li>
                                <li>
                                    Each party is an independent contractor of the other and neither
                                    is an employee, agent, partner or joint venturer of the other.
                                    Neither party shall make any commitment, by contract or
                                    otherwise, binding upon the other or represent that it has any
                                    authority to do so. This Agreement will bind and inure to the
                                    benefit of each party's permitted successors and assigns.
                                    Neither party shall assign this Agreement without the advance
                                    written consent of the other party, except that Topcoder may
                                    assign this Agreement to an affiliate or in connection with a
                                    merger, reorganization, acquisition or other transfer of all or
                                    part of Topcoder's assets or voting securities. Any notice,
                                    report, approval or consent required or permitted under this
                                    Agreement will be sent to Topcoder at c/o Appirio Inc., 201
                                    South Capitol Avenue Ste. 1100, Indianapolis, Indiana 46225,
                                    Attention: General Counsel, Email: gc@appirio.com or to User at
                                    the contact information provided by User through Topcoder.com or
                                    in an order form. Any waiver by either party of any breach of
                                    this Agreement, whether express or implied, will not constitute
                                    a waiver of any other or subsequent breach. No provision of the
                                    Agreement will be waived by any act, omission or knowledge of a
                                    party or its agents or employees except by an instrument in
                                    writing expressly waiving such provision and signed by a duly
                                    authorized officer of the waiving party. If any provision of
                                    this Agreement is adjudged by any court of competent
                                    jurisdiction to be unenforceable or invalid, that provision
                                    shall be limited or eliminated to the minimum extent necessary
                                    so that this Agreement will otherwise remain in full force and
                                    effect. Neither party shall be liable to the other for any delay
                                    of failure to perform any obligation under this Agreement
                                    (except for a failure to pay fees) if the delay or failure is
                                    due to events which are beyond the reasonable control of such
                                    party, including but not limited to any strike, blockade, war,
                                    act of terrorism, riot, natural disaster, failure or
                                    diminishment of power or of telecommunications or data networks
                                    or services, or refusal of approval or a license by a government
                                    agency. This Agreement will be deemed to have been made in, and
                                    shall be construed pursuant to the laws of the State of Delaware
                                    without regard to its conflicts of laws, provisions, or the
                                    United Nations Convention on International Sale of Goods. The
                                    jurisdiction and venue for actions related to this Agreement
                                    shall be the state and federal courts located in Wilmington
                                    County, Delaware and both parties hereby submit to the personal
                                    jurisdiction of such courts. Both parties hereby waive their
                                    right to a trial by jury. Any waivers or amendments shall be
                                    effective only if made in writing signed by a representative of
                                    the respective parties authorized to bind the parties. No
                                    provision of any purchase order or other business form
                                    (including but not limited to security access forms of any kind)
                                    employed by either party will supersede the terms and conditions
                                    of this Agreement, and any such document shall be for
                                    administrative purposes
                                </li>
                            </li>
                        </ol>
                    </li>
                </li>
            </ol>
        </div>
    </BaseModal>
)

export default TermsModal
