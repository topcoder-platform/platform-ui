import { Dispatch, FC, MouseEvent, SetStateAction, useState } from 'react'

import { ProfileProvider } from '../../profile-provider'
import { BaseModal } from '../base-modal'
import { ContactSupportModal } from '../contact-support-modal'

import styles from './PrivacyPolicyModal.module.scss'

export interface PrivacyPolicyModal {
    isOpen: boolean
    onClose: () => void
}

const PrivacyPolicyModal: FC<PrivacyPolicyModal> = ({ isOpen, onClose }: PrivacyPolicyModal) => {

    const [isSupportOpen, setIsSupportOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    function openSupportModal(event: MouseEvent<HTMLAnchorElement>): void {
        event.preventDefault()
        setIsSupportOpen(true)
    }

    return (
        <>
            <ProfileProvider>
                <ContactSupportModal
                    isOpen={isSupportOpen}
                    onClose={() => setIsSupportOpen(false)}
                />
            </ProfileProvider>

            <BaseModal
                focusTrapped={false}
                onClose={onClose}
                open={isOpen && !isSupportOpen}
                size='lg'
                title='PRIVACY POLICY'
            >
                <div className={styles.container}>
                    <ol>
                        <li>
                            <h4>1. PROCESSING ACTIVITIES COVERED</h4>
                            <ol>
                                <li>
                                    This Privacy Policy explains our privacy practices for our website,
                                    applications, the Topcoder platform, online marketing practices, and
                                    other products or services (collectively, “Services”) owned and
                                    operated by Topcoder, LLC or any of its subsidiaries (“Topcoder”).
                                    Through use of the Services, you expressly consent to our
                                    collection, use, disclosure, and retention of your personal
                                    information and other personal information as described in this
                                    Privacy Policy.
                                </li>
                            </ol>
                            <h4>2. WHAT PERSONAL DATA DO WE COLLECT?</h4>
                            <ol>
                                <li>
                                    <strong>2.1 PERSONAL DATA WE COLLECT DIRECTLY FROM YOU</strong>
                                </li>
                                <br />
                                <li>
                                    The Personal Data we collect directly from you includes identifiers,
                                    professional or employment related information, financial account
                                    information, commercial information, visual information, and
                                    internet activity information. We collect such information in the
                                    following situations:
                                </li>
                                <br />
                                <li>
                                    If you register on the platform we require that you provide contact
                                    information, such as name, email address, and country.
                                    <ul className={styles.a}>
                                        <li>
                                            If you complete the user profile on the platform after you
                                            register, you may voluntarily submit information such as contact
                                            information, photographs, user preferences, communications
                                            preferences, other biographical information, such as your
                                            occupation, location, educational background, hobbies, social
                                            media profiles, company name, areas of expertise and interests.
                                        </li>
                                        <br />
                                        <li>
                                            If you register for a competition or task on the platform we
                                            collect information specific to the process and display the
                                            time, date, and handle associated with your account.
                                        </li>
                                        <br />
                                        <li>
                                            If you post a comment in the forum, that content, the date,
                                            time, and contents are collected and are visible to people who
                                            have access to that particular forum.
                                        </li>
                                        <br />
                                        <li>
                                            If you are eligible for spayment we require payment information;
                                            such as your contact information, payment account information,
                                            and tax ID information as required by applicable laws. You may
                                            be required to complete identity verification using a third
                                            party that will require information that is country specific and
                                            can include drivers license, passport, national identification
                                            card or other government issued identification.
                                        </li>
                                        <br />
                                        <li>
                                            If you express interest in obtaining additional information
                                            about our services; request customer support; use our “Contact
                                            Us” or similar features; sign up for an event, webinar or
                                            contest; or download certain content, we may require that you
                                            provide to us contact information, such as your name, job title,
                                            company name, address, phone number, email address or username
                                            and password.
                                        </li>
                                        <br />
                                        <li>
                                            f you interact with our websites or emails, we automatically
                                            collect information about your device and your usage of our
                                            websites or emails (such as Internet Protocol (IP) addresses or
                                            other identifiers, which may qualify as Personal Data (please
                                            see the “What device and usage data we process” section, below)
                                            using cookies, web beacons, or similar technologies;Automatic
                                            Data Collection, such as IP address, MAC address or other device
                                            identifiers.
                                        </li>
                                        <br />
                                        <li>
                                            if you use and interact with our services, we automatically
                                            collect information about your device and your usage of our
                                            services through log les and other technologies, some of which
                                            may qualify as Personal Data (please see the “What device and
                                            usage data we process” section, below);
                                        </li>
                                        <br />
                                        <li>
                                            If you voluntarily submit certain information to our services,
                                            such as filling out a survey about your user experience, we
                                            collect the information you have provided as part of that
                                            request.
                                        </li>
                                        <br />
                                    </ul>
                                    <li>
                                        If you believe that your Personal Data has been provided to us
                                        improperly, or want to exercise your rights relating to your
                                        Personal Data, please contact us by using the information in the
                                        “Contact Us” section below.
                                    </li>
                                    <br />
                                </li>
                                <li>
                                    <strong>2.2 PERSONAL DATA WE COLLECT FROM OTHER SOURCES</strong>
                                    <br />
                                    <br />
                                </li>
                                <li>
                                    We also collect information about you from other sources including
                                    third parties from whom we purchase Personal Data and from publicly
                                    available information. We may combine this information with Personal
                                    Data provided by you. This helps us update, expand, and analyze our
                                    records, identify new customers, and create more tailored
                                    advertising to provide services that may be of interest to you. The
                                    Personal Data we collect from other sources includes identifiers,
                                    professional or employment-related information, education
                                    information, commercial information, visual information, internet
                                    activity information, and inferences about preferences and
                                    behaviors. In particular, we collect such Personal Data from the
                                    following sources:
                                </li>
                                <li>
                                    <ul className={styles.b}>
                                        <br />
                                        <li>
                                            Third party providers of business contact information, including
                                            mailing addresses, job titles, email addresses, phone numbers,
                                            intent data (or user behavior data), IP addresses, social media
                                            profiles, LinkedIn URLs and custom pro les, for purposes of
                                            targeted advertising, delivering relevant email content, event
                                            promotion and profiling, determining eligibility and verifying
                                            contact information; and
                                        </li>
                                        <br />
                                        <li>
                                            Another individual at your organization who may provide us with
                                            your business contact information for the purposes of obtaining
                                            services; and
                                        </li>
                                        <br />
                                        <li>
                                            Platforms such as GitHub to manage code check-ins and pull
                                            requests. If you participate in an open source or community
                                            development project, we may associate your code repository
                                            username with your community account so we can inform you of
                                            program changes that are important to your participation or
                                            relate to additional security requirements.
                                        </li>
                                        <br />
                                    </ul>
                                </li>
                            </ol>
                            <h4>3. WHAT DEVICE AND USAGE DATA DO WE PROCESS?</h4>
                            <ol>
                                <li>
                                    We use common information-gathering tools, such as tools for
                                    collecting usage data, cookies, web beacons, pixels, and similar
                                    technologies to automatically collect information that may contain
                                    Personal Data as you navigate our websites, our services, or
                                    interact with emails we have sent to you.
                                </li>
                                <br />
                                <li>
                                    <strong>3.1 DEVICE AND USAGE DATA</strong>
                                    <br />
                                    <br />
                                </li>
                                <li>
                                    As is true of most websites, we gather certain information
                                    automatically when individual users visit our websites. This
                                    information may include identifiers, commercial information, and
                                    internet activity information such as IP address (or proxy server
                                    information), device and application information, identification
                                    numbers and features, location, browser type, plug-ins,
                                    integrations, Internet service provider and/or mobile carrier, the
                                    pages and les viewed, searches, referring website, app or ad,
                                    operating system, system configuration information, advertising and
                                    language preferences, date and time stamps associated with your
                                    usage, and frequency of visits to the websites. This information is
                                    used to analyze overall trends, help us provide and improve our
                                    websites, offer a tailored experience for website users, and secure
                                    and maintain our websites. In addition, we gather certain
                                    information automatically as part of your use of our cloud products
                                    and services. This information may include identifiers, commercial
                                    information, and internet activity information such as IP address
                                    (or proxy server), mobile device number, device and application
                                    identification numbers, location, browser type, Internet service
                                    provider or mobile carrier, the pages and profiles viewed, website
                                    and webpage interactions including searches and other actions you
                                    take, operating system and system configuration information and date
                                    and time stamps associated with your usage. This information is used
                                    to maintain the security of the services, to provide necessary
                                    functionality, to improve performance of the services, to assess and
                                    improve customer and user experience of the services, to review
                                    compliance with applicable usage terms, to identify future
                                    opportunities for development of the services, to assess capacity
                                    requirements, to identify customer opportunities, and for the
                                    security of Topcoder generally (in addition to the security of our
                                    products and services). Some of the device and usage data collected
                                    by the services, whether alone or in conjunction with other data,
                                    could be personally identifying to you. Please note that this device
                                    and usage data is primarily used to identify the uniqueness of each
                                    user logging on (as opposed to specific individuals), apart from
                                    where it is strictly required to identify an individual for security
                                    purposes or as required as part of our provision of the services to
                                    our customers.
                                </li>
                                <br />
                                <li />
                                <strong>
                                    3.2 COOKIES, WEB BEACONS AND OTHER TRACKING TECHNOLOGIES ON OUR
                                    WEBSITE AND IN EMAIL COMMUNICATIONS
                                </strong>
                                <br />
                                <br />
                                <li>
                                    We use technologies such as web beacons, pixels, tags, and
                                    JavaScript, alone or in conjunction with cookies, to gather
                                    information about the use of our websites and how people interact
                                    with our emails. When you visit our websites, we, or an authorized
                                    third party, may place a cookie on your device that collects
                                    information, including Personal Data, about your online activities
                                    over time and across different sites. Cookies allow us to track use,
                                    infer browsing preferences, and improve and customize your browsing
                                    experience. We use both session-based and persistent cookies on our
                                    websites. Session-based cookies exist only during a single session
                                    and disappear from your device when you close your browser or turn
                                    off the device. Persistent cookies remain on your device after you
                                    close your browser or turn your device off. To change your cookie
                                    settings and preferences for one of our websites, click the Cookie
                                    Preferences link in the footer of the page. You can also control the
                                    use of cookies on your device, but choosing to disable cookies on
                                    your device may limit your ability to use some features on our
                                    websites and services. We also use web beacons and pixels on our
                                    websites and in emails. For example, we may place a pixel in
                                    marketing emails that notify us when you click on a link in the
                                    email. We use these technologies to operate and improve our websites
                                    and marketing emails. For instructions on how to unsubscribe from
                                    our marketing emails, please see <strong>Section 9.4</strong> below.
                                </li>
                                <br />
                                <li>
                                    <strong>3.3 SOCIAL MEDIA FEATURES</strong>
                                </li>
                                <br />
                                <li>
                                    Our websites may use social media features, such as the Facebook
                                    “like” button, the “Tweet” button and other sharing widgets (“Social
                                    Media Features”). Social Media Features may allow you to post
                                    information about your activities on our website to outside
                                    platforms and social networks. Social Media Features may also allow
                                    you to like or highlight information we have posted on our website
                                    or our branded social media pages. Social Media Features are either
                                    hosted by each respective platform or hosted directly on our
                                    website. To the extent the Social Media Features are hosted by the
                                    platforms themselves, and you click through to these from our
                                    websites, the platform may receive information showing that you have
                                    visited our websites. If you are logged in to your social media
                                    account, it is possible that the respective social media network can
                                    link your visit to our websites with your social media profile.
                                    Topcoder also allows you to log in to certain of our websites using
                                    sign-in services like Google Authentication. These services
                                    authenticate your identity and provide you the option to share
                                    certain Personal Data from these services with us such as your name
                                    and email address to pre certain Personal Data from these services
                                    with us such as your name and email address to prepopulate our
                                    sign-up form. Your interactions with Social Media Features are
                                    governed by the privacy policies of the companies providing them.
                                </li>
                            </ol>
                            <h4> 4. PURPOSES FOR WHICH WE PROCESS PERSONAL DATA AND THE LEGAL BASES
                                ON WHICH WE RELY
                            </h4>
                            <ol>
                                <li>
                                    We collect and process your Personal Data for the following
                                    purposes. Where required by law, we obtain your consent to use and
                                    process your Personal Data for these purposes. Otherwise, we rely on
                                    another authorized legal basis (including but not limited to the (a)
                                    performance of a contract or (b) legitimate interest) to collect and
                                    process your Personal Data.
                                </li>
                                <br />
                                <li>
                                    <ul className={styles.c}>
                                        <li>
                                            Providing our websites and services: We process your Personal
                                            Data to perform our contract with you for the use of our
                                            websites and services and to fulfill our obligations under the
                                            applicable terms of use and service; if we have not entered into
                                            a contract with you, we base the processing of your Personal
                                            Data on our legitimate interest to operate and administer our
                                            websites and to provide you with content you access and request
                                            (e.g., to download content from our websites);
                                        </li>
                                        <br />
                                        <li>
                                            Promoting the security of our websites and services: We process
                                            your Personal Data by tracking use of our websites and services,
                                            creating aggregated non- personal data, verifying accounts and
                                            activity, investigating suspicious activity, and enforcing our
                                            terms and policies to the extent it is necessary for our
                                            legitimate interest in promoting the safety and security of the
                                            services, systems and applications and in protecting our rights
                                            and the rights of others;
                                        </li>
                                        <br />
                                        <li>
                                            Providing necessary functionality: We process your Personal Data
                                            to perform our contract with you for the use of our websites and
                                            services; if we have not entered into a contract with you, we
                                            base the processing of your Personal Data on our legitimate
                                            interest to provide you with the necessary functionality
                                            required for your use of our websites and services;
                                        </li>
                                        <br />
                                        <li>
                                            Managing user registrations: If you have registered for an
                                            account with us, we process your Personal Data by managing your
                                            user account for the purpose of performing our contract with you
                                            according to applicable terms of service;
                                        </li>
                                        <br />
                                        <li>
                                            Handling contact and user support requests: If you ll out a
                                            “Submit a request” web form or request user support, or if you
                                            contact us by other means including via a phone call, we process
                                            your Personal Data to perform our contract with you and to the
                                            extent it is necessary for our legitimate interest in fulfilling
                                            your requests and communicating with you;
                                        </li>
                                        <br />
                                        <li>
                                            Managing event registrations and attendance: We process your
                                            Personal Data to plan and host events or webinars for which you
                                            have registered or that you attend, including sending related
                                            communications to you, to perform our contract with you;
                                        </li>
                                        <br />
                                        <li>
                                            Managing contests or promotions: If you register for a contest
                                            or promotion, we process your Personal Data to perform our
                                            contract with you. Some contests or promotions have additional
                                            rules containing information about how we will process your
                                            Personal Data;
                                        </li>
                                        <br />
                                        <li>
                                            Managing payments: If you have provided financial information to
                                            us, we process your Personal Data to verify that information and
                                            to collect payments to the extent that doing so is necessary to
                                            complete a transaction and perform our contract with you;
                                        </li>
                                        <br />
                                        <li>
                                            Developing and improving our websites and services: We process
                                            your Personal Data to analyze trends and to track your usage of
                                            and interactions with our websites and services to the extent it
                                            is necessary for our legitimate interest in developing and
                                            improving our websites and services and providing our users with
                                            more relevant content and service offerings, or where we seek
                                            your valid consent;
                                        </li>
                                        <br />
                                        <li>
                                            Assessing and improving user experience: We process device and
                                            usage data as described in Section 4.1 above, which in some
                                            cases may be associated with your Personal Data, to analyze
                                            trends and assess and improve the overall user experience to the
                                            extent it is necessary for our legitimate interest in developing
                                            and improving the service offering, or where we seek your valid
                                            consent;
                                        </li>
                                        <br />
                                        <li>
                                            Reviewing compliance with applicable usage terms: We process
                                            your Personal Data to review compliance with the applicable
                                            usage terms in our customer’s contract to the extent that it is
                                            in our legitimate interest to ensure adherence to the relevant
                                            terms;
                                        </li>
                                        <br />
                                        <li>
                                            Identifying customer opportunities: We process your Personal
                                            Data to assess new potential customer opportunities to the
                                            extent that it is in our legitimate interest to ensure that we
                                            are meeting the demands of our customers and their users’
                                            experiences;
                                        </li>
                                        <br />
                                        <li>
                                            Displaying personalized advertisements and content: We process
                                            your Personal Data to conduct marketing research, advertise to
                                            you, provide personalized information about us on and off our
                                            websites and to provide other personalized content based upon
                                            your activities and interests to the extent it is necessary for
                                            our legitimate interest in advertising our websites or, where
                                            necessary, to the extent you have provided your prior consent
                                            (please see the “Your rights relating to your Personal Data”
                                            section, below, to learn how you can control how the processing
                                            of your Personal Data by Topcoder for personalized advertising
                                            purposes);
                                        </li>
                                        <br />
                                        <li>
                                            Sending marketing communications: We will process your Personal
                                            Data or device and usage data, which in some cases may be
                                            associated with your Personal Data, to send you marketing
                                            information, product recommendations and other non-transactional
                                            communications (e.g., marketing newsletters, telemarketing
                                            calls, SMS, or push notifications) about us and our affiliates
                                            and partners, including information about our products,
                                            promotions or events as necessary for our legitimate interest in
                                            conducting direct marketing or to the extent you have provided
                                            your prior consent (please see the “Your rights relating to your
                                            Personal Data” section, below, to learn how you can control the
                                            processing of your Personal Data by Topcoder for marketing
                                            purposes); and
                                        </li>
                                        <br />
                                        <li>
                                            Complying with legal obligations: We process your Personal Data
                                            when cooperating with public and government authorities, courts
                                            or regulators in accordance with our legal obligations under
                                            applicable laws to the extent this requires the processing or
                                            disclosure of Personal Data to protect our rights or is
                                            necessary for our legitimate interest in protecting against
                                            misuse or abuse of our websites, protecting personal property or
                                            safety, pursuing remedies available to us and limiting our
                                            damages, complying with judicial proceedings, court orders or
                                            legal processes, respond to lawful requests, or for auditing
                                            purposes.
                                        </li>
                                        <br />
                                        <li>
                                            If we need to collect and process Personal Data by law, or under
                                            a contract we have entered into with you, and you fail to
                                            provide the required Personal Data when requested, we may not be
                                            able to perform our contract with you.
                                        </li>
                                    </ul>
                                </li>
                            </ol>
                            <h4>5. WHO DO WE SHARE PERSONAL DATA WITH?</h4>
                            <ol>
                                <li>
                                    Topcoder does not sell Personal Data to marketers or unaffiliated
                                    third parties. We may share your Personal Data as follows:
                                </li>
                                <br />
                                <li>
                                    <ul className={styles.d}>
                                        <li>
                                            Service Providers: With our contracted service providers, who
                                            provide services such as IT and system administration and
                                            hosting, credit card processing, research and analytics,
                                            marketing, customer support and data enrichment for the purposes
                                            and pursuant to the legal bases described above;
                                        </li>
                                        <br />
                                        <li>
                                            Affiliates: If you use our websites to register for an event or
                                            webinar organized by one of our affiliates, we may share your
                                            Personal Data with the affiliate to the extent this is required
                                            on the basis of the affiliate’s contract with you to process
                                            your registration and ensure your participation in the event; in
                                            such instances, our affiliate will process the relevant Personal
                                            Data as a separate controller and will provide you with further
                                            information on the processing of your Personal Data, where
                                            required.
                                        </li>
                                        <br />
                                        <li>
                                            Event Sponsors: If you attend an event or webinar organized by
                                            us, or download or access an asset on our website, we may share
                                            your Personal Data with sponsors of the event. If required by
                                            applicable law, you may consent to such sharing via the
                                            registration form or by allowing your attendee badge to be
                                            scanned at a sponsor booth. In these circumstances, your
                                            information will be subject to the sponsors’ privacy statements.
                                            If you do not wish for your information to be shared, you may
                                            choose to not opt-in via event/webinar registration or elect to
                                            not have your badge scanned, or you can opt-out in accordance
                                            with Section 10 below;
                                        </li>
                                        <br />
                                        <li>
                                            Customers With Whom You Are Affiliated: If you use our services
                                            as an authorized user, we may share your Personal Data with your
                                            affiliated customer responsible for your access to the services
                                            to the extent this is necessary for verifying accounts and
                                            activity, investigating suspicious activity, or enforcing our
                                            terms and policies;
                                        </li>
                                        <br />
                                        <li>
                                            Third party networks and websites: With third-party social media
                                            networks, advertising networks and websites, so that Topcoder
                                            can market and advertise on third party platforms and websites;
                                        </li>
                                        <br />
                                        <li>
                                            Professional Advisers: In individual instances, we may share
                                            your Personal Data with professional advisers acting as service
                                            providers, processors, or joint controllers – including lawyers,
                                            bankers, auditors, and insurers who provide consultancy,
                                            banking, legal, insurance and accounting services, and to the
                                            extent we are legally obliged to share or have a legitimate
                                            interest in sharing your Personal Data;
                                        </li>
                                        <br />
                                        <li>
                                            Third Parties Involved in a Corporate Transaction: If we are
                                            involved in a merger, reorganization, dissolution or other
                                            fundamental corporate change, or sell a website or business
                                            unit, or if all or a portion of our business, assets or stock
                                            are acquired by a third party, with such third party. In
                                            accordance with applicable laws, we will use reasonable efforts
                                            to notify you of any transfer of Personal Data to an
                                            unaffiliated third party
                                        </li>
                                        <br />
                                    </ul>
                                </li>
                                <li>
                                    We may also share anonymous or de-identified usage data with
                                    Topcoders service providers for the purpose of helping Topcoder in
                                    such analysis and improvements. Additionally, Topcoder may share
                                    such anonymous or de-identified usage data on an aggregate basis in
                                    the normal course of operating our business; for example, we may
                                    share information publicly to show trends about the general use of
                                    our services. Anyone using our communities, forums, blogs, or chat
                                    rooms on our websites may read any Personal Data or other
                                    information you choose to submit and post.
                                </li>
                            </ol>
                            <h4>6. INTERNATIONAL TRANSFER OF PERSONAL DATA</h4>
                            <ol>
                                <li>
                                    We are a global business. Personal Data may be stored and processed
                                    in any country where we have operations or where we engage service
                                    providers as described above in section 5. By using our Services,
                                    any personal information provided to Topcoder, where applicable law
                                    permits, you consent to the transfer, processing, and storage of
                                    such information outside of your country of residence where data
                                    protection standards may be different. We may transfer Personal Data
                                    that we maintain about you to recipients in countries other than the
                                    country in which the Personal Data was originally collected,
                                    including to the United States. Those countries may have data
                                    protection rules that are different from those of your country.
                                    However, we will take measures to ensure that any such transfers
                                    comply with applicable data protection laws and that your Personal
                                    Data remains protected to the standards described in this Privacy
                                    Policy. In certain circumstances, courts, law enforcement agencies,
                                    regulatory agencies or security authorities in those other countries
                                    may be entitled to access your Personal Data.
                                </li>
                            </ol>
                            <h4>7. CHILDREN</h4>
                            <ol>
                                <li>
                                    Topcoder recognizes the privacy interests of children and we
                                    encourage parents and guardians to take an active role in their
                                    children’s online activities and interests. Neither our Services or
                                    website are intended for children under the age of 13. Topcoder does
                                    not target its services or this Site to children under 13. Topcoder
                                    does not knowingly collect personal information from children under
                                    the age of 13.
                                </li>
                            </ol>
                            <h4>8. HOW LONG DO WE KEEP YOUR PERSONAL DATA?</h4>
                            <ol>
                                <li>
                                    We store the information we collect for as long as it is necessary
                                    for the purpose(s) for which we originally collected it. We may
                                    retain certain information for legitimate business purposes or as
                                    required by law.
                                </li>
                            </ol>
                            <h4>9. YOUR CHOICES</h4>
                            <ol>
                                <li>
                                    As a Topcoder user you have choices about how to protect and limit
                                    the collection, use, and disclosure of information about you.
                                    Depending on your location and subject to applicable law, you may
                                    have the following rights with regard to the Personal Data we
                                    control about you:
                                </li>
                                <br />
                                <li>
                                    <ul>
                                        <li>Access your Personal Data held by us</li>
                                        <br />
                                        <li>Know more about how we processed your Personal Data;</li>
                                        <br />
                                        <li>
                                            Rectify inaccurate Personal Data and, taking into account the
                                            purpose of processing the Personal Data, ensure it is complete;
                                        </li>
                                        <br />
                                        <li>
                                            Erase or delete your Personal Data (also referred to as the
                                            right to be forgotten), to the extent permitted by applicable
                                            data protection laws;
                                        </li>
                                        <br />
                                        <li>
                                            Restrict our processing of your Personal Data, to the extent
                                            permitted by law; Transfer your
                                        </li>
                                        <br />
                                        <li>
                                            Personal Data to another controller, to the extent possible
                                            (right to data portability)
                                        </li>
                                        <br />
                                        <li>
                                            Object to any processing of your Personal Data. Where we process
                                            your Personal Data for direct marketing purposes or share it
                                            with third parties for their own direct marketing purposes, you
                                            can exercise your right to object at any time to such processing
                                            without having to provide any specific reason for such
                                            objection;
                                        </li>
                                        <br />
                                        <li>
                                            Opt out of certain disclosures of your Personal Data to third
                                            parties;
                                        </li>
                                        <br />
                                        <li>
                                            If you’re under the age of 16, opt in to certain disclosures of
                                            your Personal Data to third parties;
                                        </li>
                                        <br />
                                        <li>
                                            Not be discriminated against for exercising your rights
                                            described above;
                                        </li>
                                        <br />
                                        <li>
                                            Not be subject to a decision based solely on automated
                                            processing, including profiling, which produces legal effects
                                            (“Automated Decision-Making”). Automated Decision-Making
                                            currently does not take place on our websites or in our
                                            services; and
                                        </li>
                                        <br />
                                        <li>
                                            Withdraw your consent at any time (to the extent we base
                                            processing on consent), without affecting the lawfulness of the
                                            processing based on such consent before its withdrawal.
                                        </li>
                                        <br />
                                    </ul>
                                </li>
                                <li>
                                    <strong>9.1 ACCESSING AND CHANGING YOUR INFORMATION</strong>
                                </li>
                                <br />
                                <li>
                                    You can access and change certain information through the Services.
                                    See our Help Center page for more information. You can also request
                                    a copy of the personal information Topcoder maintains about you by
                                    following the process described here.
                                </li>
                                <br />
                                <li>
                                    <strong>9.2 DELETING YOUR ACCOUNT</strong>
                                </li>
                                <br />
                                <li>
                                    You may delete your account information at any time from the user
                                    preferences page. When you delete your account, your profile is no
                                    longer visible to other users. Please note, however, that the
                                    contests, tasks, and messages you submitted prior to deleting your
                                    account will still be visible toSupport others. We may also retain
                                    certain information about you as required by law or for legitimate
                                    business purposes after you delete your account.
                                </li>
                                <br />
                                <li>
                                    <strong>9.3 CONTROLLING THE USE OF COOKIES</strong>
                                </li>
                                <br />
                                <li>
                                    To change your cookie settings and preferences for one of our
                                    websites, click the Cookie Preferences link in the footer of the
                                    page. You can also control the use of cookies on your device, but
                                    choosing to disable cookies on your device may limit your ability to
                                    use some features on our websites and services.
                                </li>
                                <br />
                                <li>
                                    <strong>9.4 CONTROLLING ADVERTISING AND ANALYTICS</strong>
                                    <br />
                                    <br />
                                </li>
                                <li>
                                    Some analytics providers we partner with may provide specific
                                    opt-out mechanisms and we may provide, as needed and as available,
                                    additional tools and third-party services that allow you to better
                                    understand cookies and how you can opt-out. For example, you may
                                    manage the use and collection of certain information by Google
                                    Analytics .
                                </li>
                                <br />
                                <li>
                                    You may also generally opt out of receiving personalized
                                    advertisements from certain third-party advertisers and ad networks.
                                    To learn more about these advertisements or to opt out, please visit
                                    the websites of the Digital Advertising Alliance and the Network
                                    Advertising Initiative, or if you are a user in the European
                                    Economic Area, Your Online Choices.
                                </li>
                                <br />
                                <li>
                                    You may also generally opt out of receiving personalized
                                    advertisements from certain third-party advertisers and ad networks.
                                    To learn more about these advertisements or to opt out, please visit
                                    the websites of the Digital Advertising Alliance and the Network
                                    Advertising Initiative
                                </li>
                                <br />
                                <li>
                                    <strong>9.5 DO NOT TRACK</strong>
                                    <br />
                                </li>
                                <br />
                                <li>
                                    Most modern web browsers give you the option to send a Do Not Track
                                    signal to the websites you visit, indicating that you do not wish to
                                    be tracked. However, there is no accepted standard for how a website
                                    should respond to this signal, and we do not take any action in
                                    response to this signal. Instead, in addition to publicly available
                                    third-party tools, we offer you the choices described in this policy
                                    to manage the collection and use of information about you.
                                </li>
                                <br />
                                <li>
                                    <strong>9.6 CONTROLLING PROMOTIONAL COMMUNICATIONS</strong>
                                    <br />
                                    <br />
                                </li>
                                <li>
                                    You may opt out of receiving some or all categories of promotional
                                    communications from us by following the instructions in those
                                    communications or by updating your email options in your account
                                    preferences here. If you opt out of promotional communications, we
                                    may still send you non-promotional communications, such as
                                    information about your account or your use of the Services.
                                </li>
                            </ol>
                            <h4>10. HOW WE SECURE YOUR PERSONAL DATA</h4>
                            <ol>
                                <li>
                                    We take appropriate precautions including organizational, technical,
                                    and physical measures to help safeguard against accidental or
                                    unlawful destruction, loss, alteration, and unauthorized disclosure
                                    of, or access to, the Personal Data we process or use. While we
                                    follow generally accepted standards to protect Personal Data, no
                                    method of storage or transmission is 100% secure You are solely
                                    responsible for protecting your password limiting transmission is
                                    100% secure. You are solely responsible for protecting your
                                    password, limiting access to your devices and signing out of
                                    websites after your sessions. If you have any questions about the
                                    security of our websites, please contact us by using the information
                                    in the “Contact us” section, below.
                                </li>
                            </ol>
                            <h4>11. CHANGES TO THIS POLICY</h4>
                            <ol>
                                <li>
                                    We may change this Privacy Policy from time to time to reflect new
                                    services, changes in our Personal Data practices or relevant laws.
                                    The “Last updated” legend at the top of this Privacy Policy
                                    indicates when this Privacy Policy was last revised. Any changes are
                                    effective when we post the revised Privacy Policy on the Services.
                                    We may provide you with disclosures and alerts regarding the Privacy
                                    Policy or Personal Data collected by posting them on our website
                                    and, if you are a User, by contacting you through our services.
                                </li>
                            </ol>
                            <h4>12. HOW TO CONTACT US</h4>
                            <ol>
                                <li>
                                    To exercise your rights regarding your Personal Data, or if you have
                                    questions regarding this Privacy Statement or our privacy practices
                                    please fill out&nbsp;
                                    <a
                                        href='#'
                                        onClick={openSupportModal}>
                                        this form
                                    </a>
                                    , email us at&nbsp;
                                    <a href='mailto:Privacy@topcoder.com'>privacy@topcoder.com</a>, call
                                    us at 855 867-1356, or write to us at:
                                </li>
                                <br />
                                <li>
                                    Attention: Topcoder Legal 201 South Capitol Avenue, Ste. 1100
                                    Indianapolis, IN 46225
                                </li>
                            </ol>
                            <h4>13. CCPA RIGHTS AND CHOICES</h4>
                            <ol>
                                <li>
                                    Section 13 of this Privacy Policy applies solely to visitors, users,
                                    and others who reside in the State of California (“consumers” or
                                    “you”) who access the Services owned and operated by Topcoder. We
                                    adopt this notice to comply with the California Consumer Privacy Act
                                    of 2018 (“CCPA”) and other California privacy laws. Any terms
                                    defined in the CCPA have the same meaning when used in this notice.
                                    The California Consumer Privacy Act requires businesses to disclose
                                    whether they sell Personal Data. We do not sell Personal Data. We
                                    may share Personal Data with third parties or allow them to collect
                                    Personal Data from our sites or Services if those third parties are
                                    authorized service providers or business partners who have agreed to
                                    our contractual limitations as to their retention, use, and
                                    disclosure of such Personal Data, or if you use Topcoder sites or
                                    Services to interact with third parties or direct us to disclose
                                    your Personal Data to third parties.
                                </li>
                                <br />
                                <li>
                                    We collect information that identifies, relates to, describes,
                                    references, is capable of being associated with, or could reasonably
                                    be linked, directly or indirectly, with a particular consumer or
                                    device (“personal information”). In particular, we have collected,
                                    and have disclosed for a business purpose, the following categories
                                    of personal information from consumers in the last twelve (12)
                                    months:
                                </li>
                                <br />
                                <li>----</li>
                                <li>
                                    We obtain the above categories of information from the sources more
                                    particularly described in Section 2 of this Privacy Policy.
                                </li>
                                <br />
                                <li>
                                    We may disclose your personal information for a business purpose to
                                    the categories of third parties described in Section 5 of this
                                    Privacy Policy. When we disclose personal information for a business
                                    purpose, we enter a contract that describes the purpose and requires
                                    the recipient to both keep that personal information confidential
                                    and not use it for any purpose except performing the contract.
                                </li>
                                <br />
                                <li>
                                    We may use or disclose the personal information we collect for one
                                    or more of the business purposes more particularly described in
                                    Sections 3, 4 and 5 of this Privacy Policy
                                </li>
                                <br />
                                <li>
                                    California law grants state residents certain rights, including the
                                    rights to access specific types of Personal Data, to learn how we
                                    process Personal Data, and to request deletion of Personal Data.. We
                                    will not deny your use of our services, or provide you a different
                                    level or quality of services for exercising any of your rights unde
                                    <br />
                                    <li>
                                        <ol>
                                            <li>
                                                1. Please note that your request does not ensure complete or
                                                comprehensive removal of the content or information, because,
                                                for example, some of your content may have been reposted by
                                                another user. Please also note that you may not be entitled to
                                                deletion of your personal information, where such retention is
                                                necessary for Topcoder to: Complete the transaction for which
                                                the personal information was collected, fulfill the terms of a
                                                written warranty or product recall conducted in accordance
                                                with federal law, provide a good or service requested by you,
                                                or reasonably anticipated within the context of our ongoing
                                                business relationship with you, or otherwise perform a
                                                contract between us.
                                            </li>
                                            <br />
                                            <li>
                                                2. Detect security incidents, protect against malicious,
                                                deceptive, fraudulent, or illegal activity; or prosecute those
                                                responsible for that activity.
                                            </li>
                                            <br />
                                            <li>
                                                3. Debug to identify and repair errors that impair existing
                                                intended functionality.
                                            </li>
                                            <br />
                                            <li>
                                                4. Exercise free speech, ensure the right of another consumer
                                                to exercise that consumer’s right of free speech, or exercise
                                                another right provided for by law.
                                            </li>
                                            <br />
                                            <li>
                                                5. Comply with the California Electronic Communications
                                                Privacy Act pursuant to Chapter 3.6 (commencing with Section
                                                1546) of Title 12 of Part 2 of the Penal Code.
                                            </li>
                                            <br />
                                            <li>
                                                6. Engage in public or peer-reviewed scientific, historical,
                                                or statistical research in the public interest that adheres to
                                                all other applicable ethics and privacy laws, when our
                                                deletion of the information is likely to render impossible or
                                                seriously impair the achievement of such research, if you have
                                                provided informed consent for the same.
                                            </li>
                                            <br />
                                            <li>
                                                7. To enable solely internal uses that are reasonably aligned
                                                with your expectations, based on your relationship with
                                                Topcoder.
                                            </li>
                                            <br />
                                            <li>
                                                9. Otherwise use your personal information, internally, in a
                                                lawful manner that is compatible with the context in which you
                                                provided the information. Support For information on how to
                                                exercise your rights, please refer to Section 9 of this
                                                Privacy Statement. If you are an authorized agent wishing to
                                                exercise rights on behalf of a California resident, please
                                                contact us using the information in the “How to Contact Us”
                                                section above and provide us with a copy of the consumer’s
                                                written authorization designating you as their agent.
                                            </li>
                                            <br />
                                            <li>
                                                We may need to verify your identity and place of residence
                                                before completing your rights request.
                                            </li>
                                            <br />
                                            <li>
                                                Effective Date May 31, 2017 – Updated Jan 27, 2022
                                            </li>
                                        </ol>
                                    </li>
                                </li>
                            </ol>
                        </li>
                    </ol>
                </div>
            </BaseModal>
        </>
    )
}

export default PrivacyPolicyModal
