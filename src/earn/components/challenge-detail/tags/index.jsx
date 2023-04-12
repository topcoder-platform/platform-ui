import { default as GenericButton } from '@earn/components/challenge-detail/GenericButton';
import { themr } from 'react-css-super-themr';

import defaultTag from './default.scss';

import dataScienceTrackTag from './primary/data-science.scss';
import designTrackTag from './primary/design.scss';
import developmentTrackTag from './primary/development.scss';
import qaTrackTag from './primary/qa.scss';

import dataScienceTrackEventTag from './event/data-science.scss';
import designTrackEventTag from './event/design.scss';
import developmentTrackEventTag from './event/development.scss';
import qaTrackEventTag from './event/qa.scss';

export const Tag = themr('Tag', defaultTag)(GenericButton);

export const DataScienceTrackTag = themr('DataScienceTrackTag', dataScienceTrackTag)(GenericButton);
export const DataScienceTrackEventTag = themr('DataScienceTrackEventTag', dataScienceTrackEventTag)(GenericButton);

export const DesignTrackTag = themr('DesignTrackTag', designTrackTag)(GenericButton);
export const DesignTrackEventTag = themr('DesignTrackEventTag', designTrackEventTag)(GenericButton);

export const DevelopmentTrackTag = themr('DevelopmentTrackTag', developmentTrackTag)(GenericButton);
export const DevelopmentTrackEventTag = themr('DevelopmentTrackEventTag', developmentTrackEventTag)(GenericButton);

export const QATrackTag = themr('QATrackTag', qaTrackTag)(GenericButton);
export const QATrackEventTag = themr('QATrackEventTag', qaTrackEventTag)(GenericButton);
