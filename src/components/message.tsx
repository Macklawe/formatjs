/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import {Context} from './injectIntl';
import {MessageDescriptor} from '../types';
const shallowEquals = require('shallow-equal/objects');

import {formatMessage as baseFormatMessage} from '../format';
import {
  invariantIntlContext,
  DEFAULT_INTL_CONFIG,
  createFormatters,
} from '../utils';
import {PrimitiveType, FormatXMLElementFn} from 'intl-messageformat/core';
import {IntlContext} from '../core';

const defaultFormatMessage = (
  descriptor: MessageDescriptor,
  values?: Record<
    string,
    PrimitiveType | React.ReactElement | FormatXMLElementFn
  >
) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(
      '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry. Using default message as fallback.'
    );
  }

  return baseFormatMessage(
    {
      ...DEFAULT_INTL_CONFIG,
      locale: 'en',
    },
    createFormatters(),
    descriptor,
    values as any
  );
};

export interface Props<
  V extends Record<string, any> = Record<string, React.ReactNode>
> extends MessageDescriptor {
  values?: V;
  tagName?: React.ElementType<any>;
  children?(...nodes: React.ReactNodeArray): React.ReactNode;
}

export default class FormattedMessage<
  V extends Record<string, any> = Record<
    string,
    PrimitiveType | React.ReactElement | FormatXMLElementFn
  >
> extends React.Component<Props<V>> {
  static defaultProps = {
    values: {},
  };
  static displayName = 'FormattedMessage';
  static contextType = Context;
  context!: React.ContextType<typeof Context>;

  constructor(props: Props<V>, context: React.ContextType<typeof IntlContext>) {
    super(props);
    if (!props.defaultMessage) {
      invariantIntlContext(context);
    }
  }

  shouldComponentUpdate(nextProps: Props<V>) {
    const {values, ...otherProps} = this.props;
    const {values: nextValues, ...nextOtherProps} = nextProps;
    return (
      !shallowEquals(nextValues, values) ||
      !shallowEquals(otherProps, nextOtherProps)
    );
  }

  render() {
    const {
      formatMessage = defaultFormatMessage,
      textComponent: Text = React.Fragment,
    } = this.context || {};
    const {
      id,
      description,
      defaultMessage,
      values,
      children,
      tagName: Component = Text,
    } = this.props;

    const descriptor = {id, description, defaultMessage};
    let nodes: string | React.ReactNodeArray = formatMessage(
      descriptor,
      values
    );

    if (!Array.isArray(nodes)) {
      nodes = [nodes];
    }

    if (typeof children === 'function') {
      return children(...nodes);
    }

    if (Component) {
      // Needs to use `createElement()` instead of JSX, otherwise React will
      // warn about a missing `key` prop with rich-text message formatting.
      return React.createElement(Component, null, ...nodes);
    }
    return nodes;
  }
}