/**
 * Help Banner component
 */
import { useState } from "react";
import cn from "classnames";

import { Button } from "~/libs/ui";

import { ReactComponent as ArrowIcon} from "../../../assets/images/icon-arrow.svg";

import moduleStyles from "./styles.module.scss";

const HelpBanner = ({
  title,
  description,
  contactSupport,
  children,
  styles = [],
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const moduleStyleStyles = styles.map(style => moduleStyles[style])
  return (
    <div className={cn(moduleStyles["banner"], ...moduleStyleStyles)}>
      <div
        className={moduleStyles["title"]}
        onClick={() => setOpen(!open)}
        role="button"
        tabIndex={0}
      >
        <span>{title}</span>

        <div className={cn(moduleStyles["arrowIcon"], open ? moduleStyles["up"] : undefined)}>
          <ArrowIcon />
        </div>
      </div>

      {open && title !== description && (
        <p className={moduleStyles["description"]}>{description}</p>
      )}
      {open && children && <div className={moduleStyles["description"]}>{children}</div>}
      {open && contactSupport && (
        <p className={moduleStyles["supportButton"]}>
          <Button primary size='md' onClick={contactSupport}>Contact support</Button>
        </p>
      )}
    </div>
  );
};

export default HelpBanner;
