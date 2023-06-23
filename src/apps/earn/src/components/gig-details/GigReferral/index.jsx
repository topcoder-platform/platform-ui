import styles from "./styles.scss";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import cn from "classnames";

import { Button } from "~/libs/ui";

import GigReferralLink from "../GigReferralLink";
import GigSocialLinks from "../GigSocialLinks";
import ReferralAuthModal from "../../ReferralAuthModal";
import ReferralEmailModal from "../../ReferralEmailModal";
import store from "../../../store";
import * as detailsSelectors from "../../../reducers/gig-details/selectors";
import * as userSelectors from "../../../reducers/user/selectors";
import * as userEffectors from "../../../actions/user/effectors";
import * as referralServices from "../../../services/referral";
import {
  areEmailsEquivalent,
  delay,
  isEmailValid,
  preventDefault,
} from "../../../utils/misc";
import { REFERRAL_PROGRAM_URL } from "../../../constants";

const GigReferral = ({ className }) => {
  const externalId = useSelector(detailsSelectors.getGigExternalId);
  const isLoggedIn = useSelector(userSelectors.getIsLoggedIn);
  const profile = useSelector(userSelectors.getProfile);
  const referralData = useSelector(userSelectors.getReferralData);

  const [email, setEmail] = useState("");
  const [sendError, setSendError] = useState("");
  const [isUserError, setIsUserError] = useState(false);
  const [doSendEmail, setDoSendEmail] = useState(false);
  const [doReloadRefData, setDoReloadRefData] = useState(false);
  const [isOpenAuthModal, setIsOpenAuthModal] = useState(false);
  const [isOpenSendModal, setIsOpenSendModal] = useState(false);

  const isBtnSendDisabled = doSendEmail || !email || !isEmailValid(email);

  const onChangeInputEmail = useCallback((event) => {
    setEmail(event.target.value);
  }, []);

  const onClickBtnSend = useCallback(() => {
    if (isLoggedIn) {
      setDoSendEmail(true);
    } else {
      setIsOpenAuthModal(true);
    }
  }, [isLoggedIn]);

  const onCloseAuthModal = useCallback(() => {
    setIsOpenAuthModal(false);
  }, []);

  const onCloseSendModal = useCallback(() => {
    setIsOpenSendModal(false);
  }, []);

  useEffect(() => {
    if (isLoggedIn && !referralData) {
      userEffectors.loadReferralData(store);
    }
  }, [isLoggedIn, referralData]);

  useEffect(() => {
    if (!doSendEmail || !profile || !referralData) {
      return;
    }

    let isMounted = true;
    const onSuccess = () => {
      if (isMounted) {
        setDoReloadRefData(true);
        setDoSendEmail(false);
        setEmail("");
      }
    };
    const onError = ({ message, isUserError = false }) => {
      if (isMounted) {
        setDoSendEmail(false);
        setSendError(message);
        setIsUserError(isUserError);
        setEmail("");
      }
    };

    setSendError("");
    setIsOpenSendModal(true);
    sendReferralEmail(
      email,
      profile,
      externalId,
      referralData,
      onSuccess,
      onError
    ).catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [email, doSendEmail, profile, referralData, externalId]);

  useEffect(() => {
    if (!doReloadRefData) {
      return;
    }

    let isMounted = true;
    const onSuccess = () => {
      if (isMounted) {
        setDoReloadRefData(false);
      }
    };
    reloadReferralData(onSuccess).catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [doReloadRefData, doSendEmail]);

  return (
    <div className={cn(styles.container, className)}>
      <div className={styles.header}>
        <div className={styles.label}>Refer this gig</div>
      </div>
      {isLoggedIn ? (
        <GigReferralLink className={styles.referralLink} />
      ) : (
        <GigSocialLinks
          className={styles.socialLinks}
          label="Share this job on:"
        />
      )}
      <div className={styles.or}>
        <span>or</span>
      </div>
      <div className={styles.incentive}>
        Refer someone to this gig and earn $500. Just add their email below. See{" "}
        <a target="_blank" href={REFERRAL_PROGRAM_URL} rel="noreferrer">
          how it works
        </a>
        .
      </div>
      <form className={styles.emailForm} action="#" onSubmit={preventDefault}>
        <input
          className={styles.emailInput}
          type="email"
          name="email"
          placeholder="Email"
          onChange={onChangeInputEmail}
          value={email}
        />
        <Button
          primary
          light
          size="md"
          className={styles.sendButton}
          disabled={isBtnSendDisabled}
          onClick={onClickBtnSend}
        >
          SEND
        </Button>
      </form>
      <ReferralAuthModal onClose={onCloseAuthModal} open={isOpenAuthModal} />
      <ReferralEmailModal
        error={sendError}
        isBusy={doSendEmail || doReloadRefData}
        isUserError={isUserError}
        onClose={onCloseSendModal}
        open={isOpenSendModal}
      />
    </div>
  );
};

export default GigReferral;

async function reloadReferralData(onSuccess) {
  await delay(3000);
  await userEffectors.loadReferralData(store, true);
  onSuccess();
}

async function sendReferralEmail(
  email,
  profile,
  externalId,
  referralData,
  onSuccess,
  onError
) {
  // users should not be able to send emails to themselves
  if (areEmailsEquivalent(profile.email, email)) {
    onError({
      message: "You are not allowed to send email to yourself.",
      isUserError: true,
    });
    return;
  }
  let {
    emailInvitesLog = "",
    emailInvitesSent,
    emailInvitesStatus,
  } = referralData.metadata;
  // check if email is in sent log alredy
  if (emailInvitesLog.includes(email)) {
    onError({ message: `${email} was already invited.`, isUserError: true });
    return;
  }
  // check if email is already referred
  let emailData = null;
  try {
    emailData = await referralServices.fetchEmailData(email);
  } catch (error) {
    // Errors are ignored.
    // See: https://github.com/topcoder-platform/community-app/blob/b44919e6e819b4ad953eefa4dca67e6229bcf773/src/shared/containers/RecruitCRMJobDetails.jsx#L88
  }
  if (emailData?.referrer) {
    onError({
      message: `${email} has already been referred.`,
      isUserError: true,
    });
    return;
  }
  try {
    await referralServices.sendReferralEmail({
      email,
      profile,
      externalId,
      referralId: referralData.id,
    });
  } catch (error) {
    onError({ message: error.toString() });
    return;
  }
  // parse the log to create an array of emails
  let invitedEmails = emailInvitesLog ? emailInvitesLog.split(",") : [];
  // prepare growSurf update payload
  // we keep only 10 emails in the log to justify program rules
  if (invitedEmails.length < 10) {
    invitedEmails.push(email);
  }
  // Auto change status when 10 emails sent
  if (
    invitedEmails.length === 10 &&
    emailInvitesStatus !== "Paid" &&
    emailInvitesStatus !== "Payment Pending"
  ) {
    emailInvitesStatus = "Payment Pending";
  }

  try {
    await referralServices.updateReferralData({
      ...referralData,
      metadata: {
        ...referralData.metadata,
        emailInvitesSent: (+emailInvitesSent || 0) + 1,
        emailInvitesLog: invitedEmails.join(","),
        emailInvitesStatus,
      },
    });
  } catch (error) {
    onError({ message: error.toString() });
    return;
  }
  onSuccess();
}
