import { useEffect } from "react";
import PT from "prop-types";
import { BaseModal, Button } from "~/libs/ui";

const ErrorMessage = ({ title, details, onOk }) => {
  useEffect(() => {
    document.body.classList.add("scrolling-disabled-by-modal");

    return () => {
      document.body.classList.remove("scrolling-disabled-by-modal");
    };
  }, []);

  return (
    <BaseModal
        open
        size='md'
        title={title}
        onClose={onOk}
        buttons={(
            <Button
                secondary
                variant="danger"
                size="md"
                onClick={(e) => {
                    e.preventDefault();
                    onOk();
                }}
            >
                OK
            </Button>
        )}
    >
        <div>
            <p>{details}</p>

            <p>
                We are sorry that you have encountered this problem. Please, contact our
                support &zwnj;
                <a href="mailto:support@topcoder.com">support@topcoder.com</a>
                &zwnj; to help us resolve it as soon as possible.
            </p>
        </div>
    </BaseModal>
  );
};

ErrorMessage.defaultProps = {
  details: "",
};

ErrorMessage.propTypes = {
  title: PT.string.isRequired,
  details: PT.string,
  onOk: PT.func.isRequired,
};

export default ErrorMessage;
