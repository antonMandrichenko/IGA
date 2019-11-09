import {formatNumber} from 'components/utils/budget';
import {mapValues, merge} from 'lodash';

let schema = {properties: {}};
let isInitialized = false;

export const newIndicatorMapping = {
  MCL: 'newMCL',
  MQL: 'newMQL',
  SQL: 'newSQL',
  opps: 'newOpps',
  users: 'newUsers'
};

export function initialize(indicatorsSchema, userIndicatorsSchema = {}) {
  schema.properties = merge(schema.properties, indicatorsSchema.properties, userIndicatorsSchema);
  schema.properties = mapValues(schema.properties, props => {
    const {isCustomMetic, ...otherProps} = props;
    return {
      ...otherProps,
      isCustom: !!isCustomMetic
    };
  });
  isInitialized = true;
}

export function getIndicatorIcon(indicator) {
  if (isInitialized && indicator) {
    if (schema.properties[indicator] && !schema.properties[indicator].isCustom) {
      return `indicator:${indicator}`;
    }
    else {
      return 'indicator:other';
    }
  }
  else {
    console.error(indicator);
  }
}

export function formatIndicatorDisplay(indicator, valueToDisplay) {
  if (isInitialized) {
    const displaySign = getIndicatorDisplaySign(indicator);
    const formattedValue = formatNumber(Math.round(valueToDisplay));
    switch (schema.properties[indicator].displayType) {
      case 'percentage':
        return `${formattedValue}${displaySign}`;
      case 'dollar':
        return `${displaySign}${formattedValue}`;
      case 'days':
        return `${formattedValue} ${displaySign}`;
      default:
        return formattedValue;
    }
  }
  else {
    console.error('indicators schema is not initialized');
  }
}

export function getIndicatorDisplaySign(indicator) {
  if (isInitialized) {
    switch (schema.properties[indicator].displayType) {
      case 'percentage':
        return '%';
      case 'dollar':
        return '$';
      case 'days':
        return 'days';
      default:
        return '';
    }
  }
  else {
    console.error('indicators schema is not initialized');
  }
}

export function getTitle(indicator) {
  if (isInitialized) {
    return schema.properties[indicator].title;
  }
  else {
    console.error('indicators schema is not initialized');
  }
}

export function getNickname(indicator, isSingular = false) {
  if (isInitialized) {
    const {nickname, nicknameSingular} = schema.properties[indicator];
    if (isSingular) {
      if (nicknameSingular) {
        return nicknameSingular;
      }
      else {
        if (nickname.slice(-1) === 's') {
          return nickname.slice(0, -1);
        }
        else if (nickname.includes('s-')) {
          return nickname.replace('s-', '-');
        }
        return nickname;
      }
    }
    else {
      return nickname;
    }
  }
  else {
    console.error('indicators schema is not initialized');
  }
}

export function getMetadata(type, indicator) {
  if (isInitialized) {
    return schema.properties[indicator] && schema.properties[indicator][type];
  }
  else {
    console.error('indicators schema is not initialized');
  }
}

export function getIndicatorsKeys() {
  if (isInitialized) {
    return Object.keys(schema.properties);
  }
  else {
    console.error('indicators schema is not initialized');
  }
}

export function getIndicatorsWithNicknames() {
  if (isInitialized) {
    return Object.keys(schema.properties).map(item => {
      return {value: item, label: schema.properties[item].nickname};
    });
  }
  else {
    console.error('indicators schema is not initialized');
  }
}

export function isRefreshed(indicator) {
  return getMetadata('isRefreshed', indicator);
}

export function getIndicatorsWithProps() {
  if (isInitialized) {
    return schema.properties;
  }
  else {
    console.error('indicators schema is not initialized');
  }
}
