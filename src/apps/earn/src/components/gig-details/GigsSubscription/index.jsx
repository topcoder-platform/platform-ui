import { useCallback, useEffect, useState } from "react";

import { Button } from "~/libs/ui";

import Modal from "../../GigsModal";
import * as services from "../../../services/gig-subscription";
import { isEmailValid, preventDefault } from "../../../utils/misc";

import modalStyles from "../../../styles/_modal.scss";
import styles from "./styles.scss";

const GigSubscription = ({ className }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [doSubscribe, setDoSubscribe] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isBtnDisabled = doSubscribe || !email || !isEmailValid(email);

  const onChangeInput = useCallback((event) => {
    setEmail(event.target.value);
  }, []);

  const onClickBtnClose = useCallback(() => {
    setEmail("");
    setIsModalOpen(false);
  }, []);

  const onClickBtnSubscribe = useCallback(() => {
    setDoSubscribe(true);
  }, []);

  const onCloseModal = useCallback(() => {
    setEmail("");
    setIsModalOpen(false);
  }, []);

  useEffect(() => {
    if (!doSubscribe) {
      return;
    }

    let isMounted = true;
    const onError = (error) => {
      if (isMounted) {
        setError(error.toString());
        setDoSubscribe(false);
        setIsModalOpen(true);
      }
    };
    const onSuccess = () => {
      if (isMounted) {
        setDoSubscribe(false);
        setIsModalOpen(true);
      }
    };

    setError("");
    subscribeToGigUpdates(email, onSuccess, onError).catch(console.error);
    return () => {
      isMounted = false;
    };
  }, [email, doSubscribe]);

  return (
    <div className={[styles["container"], className].join(' ')}>
      <div className={styles.label}>Subscribe to weekly gig updates</div>
      <form className={styles.form} action="#" onSubmit={preventDefault}>
        <input
          className={styles.input}
          name="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={onChangeInput}
        />
        <Button
          className={styles.button}
          primary
          size="md"
          onClick={onClickBtnSubscribe}
          disabled={isBtnDisabled}
        >
          SUBSCRIBE
        </Button>
      </form>
      <Modal
        modalClassName={[styles["modal"], modalStyles["modal"]].join(' ')}
        overlayClassName={modalStyles.modalOverlay}
        onClose={onCloseModal}
        open={isModalOpen}
      >
        <div className={modalStyles.title}>
          {error ? "Oops :(" : "Congratulations!"}
        </div>
        <div className={modalStyles.message}>
          {error ? error : "You are now subscribed."}
        </div>
        <div className={modalStyles.controls}>
          <Button primary size="md" onClick={onClickBtnClose}>
            CLOSE
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default GigSubscription;

async function subscribeToGigUpdates(email, onSuccess, onError) {
  let [promise] = services.updateGigsSubscription(email);
  let response = null;
  let data = null;
  try {
    response = await promise;
    data = await response.json();
  } catch (error) {
    onError("Failed to send request for subscription.");
    return;
  }
  if (response.status < 300 && data.status === "subscribed") {
    onSuccess();
    return;
  }
  if (response.status !== 404) {
    onError(
      data.detail
        ? data.detail
        : `Got ${response.status} error when trying to subscribe.`
    );
    return;
  }
  [promise] = services.addGigsSubscription(email);
  try {
    response = await promise;
    data = await response.json();
  } catch (error) {
    onError("Failed to send request for subscription.");
    return;
  }
  if (response.status < 300) {
    onSuccess();
  } else {
    onError(
      data.detail
        ? data.detail
        : `Got ${response.status} error when trying to subscribe.`
    );
  }
}
