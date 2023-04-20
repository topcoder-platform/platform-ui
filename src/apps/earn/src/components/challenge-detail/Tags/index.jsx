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
import BaseTag from './BaseTag';

export const Tag = themr('Tag', defaultTag)(BaseTag);

export const DataScienceTrackTag = themr('DataScienceTrackTag', dataScienceTrackTag)(BaseTag);
export const DataScienceTrackEventTag = themr('DataScienceTrackEventTag', dataScienceTrackEventTag)(BaseTag);

export const DesignTrackTag = themr('DesignTrackTag', designTrackTag)(BaseTag);
export const DesignTrackEventTag = themr('DesignTrackEventTag', designTrackEventTag)(BaseTag);

export const DevelopmentTrackTag = themr('DevelopmentTrackTag', developmentTrackTag)(BaseTag);
export const DevelopmentTrackEventTag = themr('DevelopmentTrackEventTag', developmentTrackEventTag)(BaseTag);

export const QATrackTag = themr('QATrackTag', qaTrackTag)(BaseTag);
export const QATrackEventTag = themr('QATrackEventTag', qaTrackEventTag)(BaseTag);
