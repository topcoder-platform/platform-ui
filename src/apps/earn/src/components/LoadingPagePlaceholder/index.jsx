/**
 * Just the loading indicator centered above gray background.
 */

import LoadingIndicator from '@earn/components/LoadingIndicator';
import './style.scss';

export default function LoadingPagePlaceholder() {
  return (
    <div styleName="background">
      <div styleName="page">
        <LoadingIndicator />
      </div>
    </div>
  );
}
