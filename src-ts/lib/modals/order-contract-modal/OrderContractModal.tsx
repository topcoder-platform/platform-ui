import { FC } from 'react'

import { BaseModal } from '../base-modal'

import styles from './OrderContractModal.module.scss'

interface OrderContractModalProps {
    isOpen: boolean
    onClose: () => void
}

const OrderContractModal: FC<OrderContractModalProps> = ({ isOpen, onClose }: OrderContractModalProps) => (

    <BaseModal
        onClose={onClose}
        open={isOpen}
        size='lg'
        title='TOPCODER ONLINE ORDER USER AGREEMENT'
    >
        <div className={styles.container}>
            <p className={styles.sm}>Date of last revision: January 28, 2022</p>
            <p>
                This Topcoder Online Order User Agreement (the "Agreement") is a contract
                between you (referred to herein as "User") and Topcoder LLC. ("Topcoder")
                and applies to all online services available therein (the "Services") and
                Deliverables. By submitting an Online Order through
                {' '}
                <a
                    target='_blank'
                    className={styles.topCoderLink}
                    href='https://www.topcoder.com/'
                    rel='noreferrer'
                >
                    https://www.topcoder.com/
                    {' '}
                </a>
                {' '}
                and related sub-domains (“the Site”) , User has accepted this Agreement
                and has agreed to be bound by the terms of this Agreement. Topcoder
                reserves the right, at its discretion, to amend this Agreement at any time
                by posting a revised version on the Site without notice. The revised
                version will be effective from the time Topcoder posts it. User’s
                continued use of the Services after the amendment to the Agreement shall
                signify User’s understanding and acceptance of the amended Agreement.
                User’s usage and viewing of the Site shall be governed by Topcoder Online
                Customer Terms of Use Agreement that the User has agreed to while
                registering on the Site, which is incorporated herein through reference.
            </p>
            <ol>
                <li>
                    <h4>1. SERVICES AND SPECIFICATIONS</h4>
                    <ol>
                        <li>
                            <p>
                                <strong>1.1. </strong>
                                {' '}
                                Process and Specifications for Online
                                Orders. If ordering the Services online via the Site (referred to
                                as an “
                                <strong>Online Order”)</strong>
                                :
                            </p>
                            <ol>
                                <li>
                                    <strong>a. </strong>
                                    {' '}
                                    To utilize the Services, the Site requires
                                    the User to provide specifications and information with respect
                                    to the desired Services and deliverables in reasonable detail
                                    (the "
                                    <strong>Preliminary Specifications"</strong>
                                    ) on the Site.
                                </li>
                                <li>
                                    <strong>b. </strong>
                                    {' '}
                                    After submitting Preliminary Specifications
                                    on the Site, User provides payment information and authorizes
                                    Project Fees (as defined below) associated with the Services and
                                    deliverables.
                                </li>
                                <li>
                                    <strong>c .</strong>
                                    {' '}
                                    Topcoder may in its sole discretion accept
                                    or refer Preliminary Specifications to a Topcoder representative
                                    for adjustments in the Preliminary Specifications to be
                                    acceptable to Topcoder or reject the Preliminary Specifications.
                                    Preliminary Specifications accepted by Topcoder will be referred
                                    to as “
                                    <strong>Specifications</strong>
                                    ” and result in an Online
                                    Order.
                                </li>
                                <li>
                                    <strong>d.</strong>
                                    {' '}
                                    To the extent the parties are not able to
                                    reach agreement on the Specifications, including, but not
                                    limited to situations where the information provided by User is
                                    insufficient to create Specifications or the Preliminary
                                    Specifications are outside the scope of the services described
                                    on the Site, Topcoder shall not charge User any Project Fees and
                                    Topcoder shall have no further liability or obligations under
                                    this Agreement.
                                </li>
                                <li>
                                    <strong>e.</strong>
                                    {' '}
                                    Topcoder agrees to provide the Deliverables
                                    as per the Specifications. Deliverables are provided by
                                    launching Work (as defined below) using Topcoder's crowdsourcing
                                    platform, available at the Site and online and mobile tools for
                                    engaging the Topcoder Community (the “
                                    <strong>Platform</strong>
                                    ”).
                                </li>
                            </ol>
                            <p>
                                <strong>1.2. Changes to Scope of Services.</strong>
                                {' '}
                                If User
                                desires to change a Specification, User will submit a written
                                request to Topcoder detailing the proposed changes. If Topcoder is
                                able to accommodate such changes, Topcoder shall prepare an
                                amendment to the Specifications and/or Order Form detailing the
                                changes, any fee adjustments required as a result of such changes,
                                any adjustments to the delivery schedule required as a result of
                                such changes, and any other adjustments (a “Change Order”). If the
                                Change Order is agreeable to User, both parties will execute the
                                Change Order.
                            </p>
                            <h4>2. DEFINITIONS</h4>
                            <ol>
                                <p>
                                    <strong>2.1.</strong>
                                    {' '}
                                    For the purposes of this Agreement, the
                                    following capitalized terms have the meanings assigned to them
                                    in this Section 2. Any capitalized terms used in this Agreement
                                    but not otherwise defined in this Section shall have the
                                    meanings assigned to them elsewhere in this Agreement.
                                </p>
                                <li>
                                    <strong>a.</strong>
                                    {' '}
                                    “
                                    <strong>Deliverables</strong>
                                    ”: shall mean
                                    those items described and itemized in the Specifications.
                                </li>
                                <li>
                                    <strong>b.</strong>
                                    {' '}
                                    “
                                    <strong>Project Fees</strong>
                                    ”: The fees
                                    User needs to pay for the Services and the creation of the
                                    Deliverables as either specified on the Site or as may be
                                    mutually agreed between the parties in the Online Order. Project
                                    Fees are on a fixed price basis.
                                </li>
                                <li>
                                    <strong>c.</strong>
                                    {' '}
                                    “
                                    <strong>Work</strong>
                                    ”: Services and/or
                                    Deliverables provided through the Platform (as defined below)
                                    utilizing the Topcoder Community. Work may also be referred to
                                    as “Challenges”, “Tasks”, "Competitions" or "Contests”. Work is
                                    primarily enabled through the following: “
                                    <strong>Challenge</strong>
                                    ”: A fixed-price, outcome-based online
                                    competition on the Platform utilizing the Topcoder Community.
                                    Also referred to as Competitions or Tasks. Work may result in
                                    multiple deliverables from the Topcoder Community (“
                                    <strong>Submissions</strong>
                                    ”). However, not all Submissions
                                    shall be considered as Deliverables. Deliverables shall solely
                                    be determined and provided to User in accordance with criteria
                                    defined in Specifications after being selected through
                                    Topcoder’s deliverable review and scoring processes.
                                </li>
                                <li>
                                    <strong>d.</strong>
                                    {' '}
                                    “
                                    <strong>Effective Date</strong>
                                    ”: For
                                    Online Orders, the Effective Date is the date that Preliminary
                                    Specifications are submitted by User.
                                </li>
                                <li>
                                    <strong>e.</strong>
                                    {' '}
                                    “
                                    <strong>Topcoder Community</strong>
                                    ”:
                                    Members of Topcoder’s global community who are registered
                                    members on the Platform.
                                </li>
                            </ol>
                            <h4>3. PLATFORM USAGE</h4>
                            <ol>
                                <li>
                                    Utilization of the Site allows User to leverage the Topcoder
                                    Community for the purchase/procurement of Services and
                                    Deliverables. To the extent User desires to access the Topcoder
                                    Platform in ways not provided by the Site, User may enter into a
                                    separate agreement with Topcoder to purchase Work and/or a
                                    subscription for such services. User may contact Topcoder via
                                    email at support@topcoder.com for more details about
                                    subscription pricing and fees associated with Work when utilized
                                    with a subscription. Under no scenario shall the Platform and
                                    tools/documentation related to the Platform be deemed to be a
                                    Deliverable.
                                </li>
                            </ol>
                            <h4>4. TITLE AND OWNERSHIP</h4>
                            <ol>
                                <li>
                                    <strong>4.1</strong>
                                    {' '}
                                    <strong>Retained Rights. </strong>
                                    {' '}
                                    Nothing
                                    in the Agreement is intended to grant User any right to any of
                                    Topcoder’s intellectual property, including without limitation,
                                    any of its know how, works in any media, software, information,
                                    trade secrets, materials, property or proprietary interest,
                                    trademarks, copyrights or logos (“Retained Rights”).
                                </li>
                                <li>
                                    <strong>4.2 Title to the Platform.</strong>
                                    {' '}
                                    Topcoder retains all
                                    right, title and interest in and to the Platform, tools and
                                    associated documentation and materials. Any use of the Platform,
                                    tools or associated documentation or materials beyond the scope
                                    of the rights expressly granted in this Agreement is prohibited
                                    and shall constitute a material breach of this Agreement,
                                    pursuant to which Topcoder may immediately terminate this
                                    Agreement and any work-in-progress. User shall retain Topcoder's
                                    copyright notices and authorship credits in the Platform, tools
                                    and associated documentation or materials.
                                </li>
                                <li>
                                    <strong> 4.3. Deliverables.</strong>
                                    {' '}
                                    Regardless of Work
                                    methodology, Deliverables shall be provided in accordance with
                                    criteria defined in Specifications, the selected Services, and
                                    Topcoder’s standard deliverable review and scoring processes.
                                    Unless otherwise agreed to by the parties pursuant to this
                                    Section 4.3, User acknowledges and agrees that it will obtain
                                    rights solely in and to the Deliverables, as further described
                                    in Section 7, and no other Submissions from Work. Subject to the
                                    terms of this Agreement, and upon payment in full of the Project
                                    Fees, Topcoder assigns and will assign to User the intellectual
                                    property rights in Deliverables created for the User pursuant to
                                    any Online Order which is expressly designated as being for
                                    "development work" (“
                                    <strong>Custom Software</strong>
                                    ”).
                                    Deliverables shall be deemed to have been accepted upon User’s
                                    receipt of the Deliverables. The rights in and to any
                                    Submissions other than the Deliverables shall be retained by the
                                    member of the Topcoder Community who submitted such a
                                    Submission. For the purposes of this Agreement, such Submissions
                                    shall be deemed to be Topcoder’s Confidential Information. Upon
                                    mutual agreement of the parties, User may purchase more than one
                                    (1) Submission and Topcoder shall invoice User for such
                                    additional payment necessary to purchase such additional
                                    Submission(s), and upon Topcoder's receipt of such payment, such
                                    purchased additional Submission(s) shall also be deemed to be
                                    Deliverable(s). In accordance with above terms, User owns and
                                    will retain ownership (including all intellectual property
                                    rights) in and to the Deliverables, and Topcoder will assign and
                                    does hereby assign all rights, title and interests in the
                                    Deliverables to User. For the avoidance of doubt, the parties
                                    acknowledge that to the extent the Deliverables consist of
                                    software applications designed to be operated on or accessed
                                    through a third- party platform (such as, including not limited
                                    to, Amazon, Salesforce.com, Workday, or Google), then User is
                                    solely responsible for obtaining license rights to access and
                                    utilize such platforms in relation to using the Deliverables.
                                </li>
                            </ol>
                            <h4>5. PAYMENT</h4>
                            <ol>
                                <li>
                                    <strong>5.1</strong>
                                    {' '}
                                    All Project Fees shall be placed as a hold
                                    on User’s debit, credit card or other payment means after the
                                    Preliminary Specifications are submitted and Project Fees are
                                    authorized by User. Upon Topcoder agreement to the Preliminary
                                    Specification (resulting in Specification & Online Order), User
                                    shall be charged the total Project Fees. If Topcoder refers User
                                    to a Topcoder representative, the hold shall stand as cancelled.
                                    User is responsible for paying all Project Fees in a timely
                                    manner via a valid and authorized payment method for all Project
                                    Fees. The parties understand and acknowledge that Topcoder is
                                    under no obligation to provide any Services or deliver any
                                    Deliverables until the Project Fees are paid in full, using the
                                    payment method Topcoder determines to be acceptable as described
                                    on the Site. User agrees that Topcoder may charge the payment
                                    method provided by User for all Project Fees. User represents
                                    and warrants that User has the legal right to use any debit or
                                    credit cards or other payment means used to initiate any
                                    transaction. User agrees to pay all charges incurred by User at
                                    the prices in effect when such charges are incurred. User will
                                    also be responsible for paying any applicable taxes relating to
                                    User's purchase of Services and/or Deliverables. Except as
                                    explicitly set forth in Section 1 or Section 10.2, all Project
                                    Fees are final and non- refundable. Topcoder does not have
                                    access to any User’s debit, credit or bank information. The
                                    payment and related processing shall be governed by the terms
                                    and conditions of a reputable third party payment processor
                                    appointed by Topcoder (which can be changed by Topcoder anytime
                                    at its will without any requirement of a notification). Topcoder
                                    cannot be held liable in any manner for a dispute or issue
                                    arising out of or related to payment processing.
                                </li>
                            </ol>
                            <h4>6. TERM AND TERMINATION</h4>
                            <ol>
                                <li>
                                    <strong>6.1</strong>
                                    {' '}
                                    This Agreement will begin on the Effective
                                    Date and will continue unless terminated as set forth in this
                                    Agreement ("
                                    <strong>Term"</strong>
                                    ). Topcoder may, in its sole
                                    discretion, terminate this Agreement and/or any Online Order(s),
                                    at any time, upon prior written notice to the User, which will
                                    result in the termination of associated rights granted to the
                                    User under this Agreement and/or Online Order as applicable. The
                                    sole and exclusive remedy provided to User is specified in
                                    Section 6.4.
                                </li>
                                <li>
                                    <strong>6.2</strong>
                                    {' '}
                                    Either party may terminate this Agreement
                                    and/or any Online Order(s) if the other party: (a) fails to cure
                                    any material breach of this Agreement or the applicable Online
                                    Order(s) within thirty (30) days after receipt of the written
                                    notice of such breach; (b) ceases operation without a successor;
                                    or (c) seeks protection under any bankruptcy or comparable
                                    proceeding, or if any such proceeding is instituted against such
                                    party (and not dismissed within sixty (60) days thereafter).
                                </li>
                                <li>
                                    <strong>6.3</strong>
                                    {' '}
                                    Section 5 (Payment), Section 6 (Term and
                                    Termination), Section 8 (Confidential Information), Section 9
                                    (Limitation of Liability), and Section 11 (General) of this
                                    Agreement shall survive any termination or expiration hereof.
                                </li>
                                <li>
                                    <strong>6.4</strong>
                                    {' '}
                                    In the event of a termination of an Online
                                    Order: (a) an User’s right to avail the Services under such
                                    Online Order is automatically revoked; and ; (b) Topcoder shall
                                    refund the Project Fees on a pro rata basis unless the
                                    termination is due to User’s breach of this Agreement and/or
                                    Online Order, in which case Topcoder shall not be obligated to
                                    any refund.
                                </li>
                                <li>
                                    <strong>6.5</strong>
                                    {' '}
                                    In the event of a termination of the
                                    Agreement before all Online Orders executed hereunder are
                                    terminated or completed, Topcoder will continue to perform and
                                    deliver Services for which the User has already paid and the
                                    terms of this Agreement shall remain in full force until the
                                    termination or completion of such Online Orders.
                                </li>
                            </ol>
                            <h4>
                                7. THIRD PARTY SOFTWARE AND EXPORT/IMPORT COMPLIANCE
                            </h4>
                            <ol>
                                <li>
                                    <strong>7.1. Work.</strong>
                                    {' '}
                                    Topcoder will conduct Work for User
                                    on the Platform among members of the Topcoder Community using
                                    the Platform tools to provide the Services. Topcoder shall have
                                    final control and ownership over all Work documents (e.g.,
                                    specifications, contest rules and requirements, prizes, etc.).
                                </li>
                                <li>
                                    <strong>7.2. Third-Party Software.</strong>
                                    {' '}
                                    If the
                                    Specifications (as mutually agreed by the parties) provide for
                                    the Deliverables to interface with, accompany, or include
                                    software or material not developed by Topcoder or its
                                    affiliates, including any open source software ("Third-Party
                                    Software"), any such Third-Party Software shall be subject to
                                    its own terms and conditions, and shall not be considered
                                    included as the part of the Deliverable under this Agreement.
                                    Third-Party Software shall accompany or be included in
                                    Deliverables only with User's permission. User shall bear all
                                    license fees and other expenses, if any, applicable to such
                                    Third-Party Software.
                                </li>
                                <li>
                                    <strong>7.3. Export Compliance.</strong>
                                    {' '}
                                    Regardless of whether
                                    User is a U.S.-based entity, User shall not export or re-export
                                    any of the Deliverable, (in whole or in part) to any country
                                    without ensuring that such export complies with the Export
                                    Administration Regulations of the U.S. Department of Commerce,
                                    and any other applicable statute, regulation, or government
                                    order. User warrants that it is not named on any restricted or
                                    denied party list pursuant to any embargo, sanction, debarment
                                    or denied party designation maintained by any country or
                                    government, including without limitation U.S. government whose
                                    laws are applicable to this Agreement.
                                </li>
                            </ol>
                            <h4>8. CONFIDENTIAL INFORMATION</h4>
                        </li>
                        <ol>
                            <li>
                                <strong>8.1. Confidential Information.</strong>
                                {' '}
                                "Confidential
                                Information" means information which is provided by either party
                                under this Agreement (in such capacity, the "Disclosing Party") to
                                the other party (in such capacity, the "Receiving Party") which is
                                marked as “confidential,” proprietary” or some similar indication;
                                (ii) is expressly advised by the Disclosing Party to be
                                confidential through some contemporaneous written means; or (iii)
                                which the Receiving Party would reasonably construe to be
                                confidential information under the circumstances. Confidential
                                Information may include information that is proprietary, trade
                                secret and/or confidential, including, but not limited to,
                                techniques, designs, specifications, drawings, blueprints,
                                tracings, diagrams, models, samples, flow charts, data, computer
                                programs, disks, diskettes, tapes, business plans, marketing
                                plans, User names and other technical, financial or commercial
                                information and intellectual property. For the avoidance of doubt,
                                notwithstanding anything to the contrary, the Platform, tools and
                                associated documentation or materials, and any other information
                                that Topcoder provides to User hereunder that should reasonably be
                                known to be confidential, shall constitute Topcoder's Confidential
                                Information. Expect as expressly authorized herein, the Receiving
                                Party will (i) hold in confidence and not use or disclose any
                                Confidential Information using the same degree of care that it
                                uses to safeguard its own confidential materials or data of
                                similar nature; and (ii) limit dissemination of such Confidential
                                Information to persons within the Receiving Party's business
                                organization who have a need to receive such Confidential
                                Information.
                            </li>
                            <li>
                                <strong>8.2. Exceptions.</strong>
                                {' '}
                                These confidentiality
                                obligations shall not apply to any Confidential Information which:
                                (a) is generally known to the public at the time of disclosure or
                                later becomes so generally known (including Confidential
                                Information which is disclosed as part of Work); (b) is
                                subsequently learned from a third party without a duty of
                                confidentiality; (c) at the time of disclosure was already in the
                                possession of the Receiving Party; (d) was developed by employees
                                or agents of the Receiving Party independently of and without
                                reference to any Confidential Information of the Disclosing Party;
                                and (e) is required by law, court order or a governmental agency
                                to be disclosed.
                            </li>
                            <li>
                                <strong>
                                    8.3. Title and License to User's Confidential Information.
                                </strong>
                                {' '}
                                All right, title, and ownership to Confidential Information
                                provided by User hereunder, including the Preliminary
                                Specifications, remains with User. User represents that it has all
                                rights in the Confidential Information 6 necessary to include it
                                in Work. User hereby grants to Topcoder a license to use such
                                Confidential Information provided by User solely for the purposes
                                of providing the Services, including conducting the applicable
                                Work and providing the Deliverable.
                            </li>
                            <li>
                                <strong>8.4. Equitable Relief.</strong>
                                {' '}
                                The Receiving Party
                                acknowledges that unauthorized disclosure of Confidential
                                Information would cause substantial harm for which damages alone
                                may not be a sufficient remedy, and therefore that upon any such
                                disclosure by the Receiving Party the Disclosing Party shall be
                                entitled to seek appropriate equitable relief in addition to
                                whatever other remedies it might have at law.
                            </li>
                            <li>
                                <strong>8.5. Confidentiality on the Platform.</strong>
                                {' '}
                                User
                                acknowledges and agrees that members of the Topcoder Community are
                                not bound by the confidentiality obligations under this Section 8
                                and User acknowledges that any Specifications or other information
                                that the Topcoder Community is provided in connection with the
                                Services (except for personally identifiable information or
                                payment information) is not Confidential Information.
                            </li>
                            <li>
                                <strong>8.6. Confidentiality Period:</strong>
                                {' '}
                                The terms of this
                                Section 8 shall continue in full force and effect for a period of
                                three (3) years from the date of disclosure of such Confidential
                                Information.
                            </li>
                            <li>
                                <strong>8.7. Effect of Termination:</strong>
                                {' '}
                                In the event of
                                termination of this Agreement, upon written request of the
                                Disclosing Party, the Receiving Party shall promptly return the
                                Disclosing Party’s Confidential Information, or at the Disclosing
                                Party’s option destroy any remaining Confidential Information and
                                certify that such destruction has taken place, provided however
                                that Topcoder may retain a minimum of one copy of all Deliverable
                                and relevant project documentation for archival and audit
                                purposes. This does not apply to Confidential Information or
                                copies thereof which must be stored by the Receiving Party
                                according to law, provided that such Confidential Information or
                                copies thereof shall be subject to an indefinite confidentiality
                                obligation.
                            </li>
                        </ol>
                        <h4>9. LIMITATION OF LIABILITY</h4>
                        <ol>
                            <li>
                                NEITHER PARTY WILL BE LIABLE FOR ANY LOSS OF USE, INTERRUPTION OF
                                BUSINESS, LOST PROFITS, OR ANY INDIRECT, EXEMPLARY, PUNITIVE,
                                SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES OF ANY KIND
                                REGARDLESS OF THE FORM OF ACTION WHETHER IN CONTRACT, TORT
                                (INCLUDING NEGLIGENCE), STRICT PRODUCT LIABILITY, OR OTHERWISE,
                                EVEN IF IT HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN
                                NO EVENT SHALL TOPCODER'S AGGREGATE LIABILITY TO USER EXCEED THE
                                TOTAL PROJECT FEES PAID BY USER TO TOPCODER. THE EXISTENCE OF ONE
                                OR MORE CLAIMS WILL NOT ENLARGE THIS LIMIT. THE PARTIES AGREE THAT
                                THE LIMITATIONS SPECIFIED IN THIS SECTION 9 WILL SURVIVE AND APPLY
                                EVEN IF ANY LIMITED REMEDY SPECIFIED IN THIS AGREEMENT IS FOUND TO
                                HAVE FAILED OF ITS ESSENTIAL PURPOSE. BOTH PARTIES WILL IN ALL
                                CIRCUMSTANCES USE THEIR BEST ENDEAVORS TO MITIGATE ANY LOSSES
                                WHICH ARE SAID TO ARISE BY REASON OF THE BREACH, NEGLIGENCE OR
                                OTHER DEFAULT ON THE PART OF THE OTHER PARTY.
                            </li>
                        </ol>
                        <h4>10. WARRANTY</h4>
                        <ol>
                            <li>
                                <strong>10.1. Representation.</strong>
                                {' '}
                                User represents and
                                warrants that (i) it has the requisite power and corporate
                                approvals and authority to enter into this Agreement and to
                                perform all of its obligations under this Agreement; (ii) it will
                                comply with all applicable laws, rules, and regulations, including
                                without limitation, all applicable data protection, privacy and
                                intellectual property laws in their conduct pursuant to this
                                Agreement and relating to its use of Site, Services and
                                Deliverables; (iii) it will comply with all the policies and
                                procedures that may be published on the Site from time to time
                                (including without limitation, Privacy Policy) which shall be
                                construed to form a part of the Agreement; and (iv) it shall
                                provide accurate, current and complete information while creating
                                a profile or registering an account on the Site and shall not
                                upload, transmit or otherwise provide access or make available any
                                information that contains personally identifiable information of
                                others, including without limitation, names, addresses, identity
                                numbers or phone numbers. Further, User represents that it shall
                                update its account information on an ongoing basis to ensure
                                completeness and accuracy of information.
                            </li>
                            <li>
                                <strong>10.2. Limited Warranty.</strong>
                                {' '}
                                For a period of ten (10)
                                days from the provision of the Deliverables to the User, Topcoder
                                warrants that the Deliverables will materially conform to the
                                Specifications. If the Deliverables do not materially conform to
                                the Specifications, User shall, within ten (10) days from the
                                provision of the Deliverables to the User, notify Topcoder in
                                writing of and adequately describe any such non- conformance.
                                User's exclusive remedy and Topcoder's sole obligation shall be
                                to, at Topcoder's sole discretion, either (1) investigate the
                                errors and use commercially reasonable efforts to bring the
                                Deliverables into material conformance with the Specifications; or
                                (2) refund or credit the Project Fees paid for those Deliverables.
                                The warranty set forth in this section does not apply to
                                Deliverables that have been modified, damaged or operated contrary
                                to the Specifications.
                            </li>
                            <li>
                                <strong>10.3. Disclaimer.</strong>
                                {' '}
                                THE FOREGOING WARRANTIES ARE
                                EXCLUSIVE REMEDIES AND ARE IN LIEU OF ALL OTHER REPRESENTATIONS OR
                                WARRANTIES, EXPRESS OR IMPLIED, STATUTORY OR OTHERWISE RELATED TO
                                THIS AGREEMENT, INCLUDING THE SITE, THE SERVICES AND THE
                                DELIVERABLES, INCLUDING WITHOUT LIMITATION, ANY WARRANTY OF
                                MERCHANTABILITY, OR FITNESS FOR A PARTICULAR PURPOSE, TITLE, OR
                                NONINFRINGEMENT. TOPCODER MAKES NO OTHER WARRANTY OF ANY KIND TO
                                USER OR TO ANY OTHER PARTY. THE PARTIES ACKNOWLEDGE AND AGREE THAT
                                THE PROJECT FEES CHARGED BY TOPCODER UNDER THIS AGREEMENT REFLECT
                                THE ALLOCATION OF RISKS PROVIDED BY THE FOREGOING WARRANTY, THE
                                LIMITATIONS OF LIABILITY, AND OTHER TERMS SET FORTH IN THIS
                                AGREEMENT, AND ANY MODIFICATION OF THE ALLOCATION OF RISKS WOULD
                                AFFECT THE PROJECT FEES CHARGED.
                            </li>
                        </ol>
                        <h4>11. GENERAL</h4>
                        <ol>
                            <li>
                                <strong>11.1.</strong>
                                {' '}
                                Each party is an independent contractor of
                                the other and neither is an employee, agent, partner or joint
                                venturer of the other.
                            </li>
                            <li>
                                <strong>11.2.</strong>
                                {' '}
                                For the duration of this Agreement and for
                                twelve (12) months thereafter, User shall not solicit for
                                employment any persons employed or otherwise engaged by Topcoder,
                                whether or not such individual had direct interaction with User;
                                the foregoing restriction includes, but is not limited to, the
                                Topcoder Community, persons who are Topcoder employees,
                                contractors or agents.
                            </li>
                            <li>
                                <strong>11.3.</strong>
                                {' '}
                                Neither party shall make any commitment, by
                                contract or otherwise, binding upon the other or represent that it
                                has any authority to do so. This Agreement will bind and inure to
                                the benefit of each party's permitted successors and assigns.
                                Neither party shall assign this Agreement without the advance
                                written consent of the other party, except that Topcoder may
                                assign this Agreement to an affiliate or in connection with a
                                merger, reorganization, acquisition or other transfer of all or
                                part of Topcoder's assets or voting securities.
                            </li>
                            <li>
                                <strong>11.4.</strong>
                                {' '}
                                Any notice, report, approval or consent
                                required or permitted under this Agreement will be sent to
                                Topcoder at c/o Appirio Inc., 201 South Capitol Avenue Ste. 1100,
                                Indianapolis, Indiana 46225, Attention: General Counsel, Email:
                                gc@appirio.com or to User at the contact information provided by
                                User through the Site or in an Order Form.
                            </li>
                            <li>
                                <strong>11.5.</strong>
                                {' '}
                                Any waiver by either party of any breach of
                                this Agreement, whether express or implied, will not constitute a
                                waiver of any other or subsequent breach. No provision of the
                                Agreement will be waived by any act, omission or knowledge of a
                                party or its agents or employees except by an instrument in
                                writing expressly waiving such provision and signed by a duly
                                authorized officer of the waiving party. If any provision of this
                                Agreement is adjudged by any court of competent jurisdiction to be
                                unenforceable or invalid, that provision shall be limited or
                                eliminated to the minimum extent necessary so that this Agreement
                                will otherwise remain in full force and effect.
                            </li>
                            <li>
                                <strong>11.6.</strong>
                                {' '}
                                Neither party shall be liable to the other
                                for any delay of failure to perform any obligation under this
                                Agreement (except for a failure to pay fees) if the delay or
                                failure is due to events which are beyond the reasonable control
                                of such party, including but not limited to any strike, blockade,
                                government actions, war, act of terrorism, riot, natural disaster,
                                failure or diminishment of power or of telecommunications or data
                                networks or services, cyber-attack, or refusal of approval or a
                                license by a government agency.
                            </li>
                            <li>
                                <strong>11.7.</strong>
                                {' '}
                                Topcoder may refer to User by name as a
                                customer in sales presentations and on Topcoder’s website and
                                other marketing material. Topcoder may develop case studies for
                                marketing purposes on User’s usage of Topcoder and share publicly
                                notifying User.
                            </li>
                            <li>
                                <strong>11.8.</strong>
                                {' '}
                                This Agreement will be deemed to have been
                                made in, and shall be construed pursuant to the laws of the State
                                of Delaware without regard to its conflicts of laws, provisions,
                                or the United Nations Convention on International Sale of Goods.
                                The jurisdiction and venue for actions related to this Agreement
                                shall be the state and federal courts located in Wilmington
                                County, Delaware and both parties hereby submit to the personal
                                jurisdiction of such courts. Both parties hereby waive their right
                                to a trial by jury.
                            </li>
                            <li>
                                <strong>11.9.</strong>
                                {' '}
                                Any waivers or amendments shall be
                                effective only if made in writing signed by a representative of
                                the respective parties authorized to bind the parties. No
                                provision of any purchase order or other business form (including
                                but not limited to security access forms of any kind) employed by
                                either party will supersede the terms and conditions of this
                                Agreement, and any such document shall be for administrative
                                purposes only and shall have no legal effect. In the event of any
                                inconsistency between this Agreement and the privacy policy on the
                                Site (“
                                <strong>Privacy Policy</strong>
                                ”), the terms of this
                                Privacy Policy shall control. Both parties agree that this
                                Agreement is the complete and exclusive statement of the mutual
                                understanding of the parties, and supersedes and cancels all
                                previous written and oral agreements and communications relating
                                to the subject matter of this Agreement. In the event of any
                                inconsistency between this Agreement and the Topcoder Online
                                Customer Terms of Use Agreement, the one more onerous shall
                                control.
                            </li>
                        </ol>
                    </ol>
                    <ol />
                </li>
            </ol>
        </div>
    </BaseModal>
)

export default OrderContractModal
