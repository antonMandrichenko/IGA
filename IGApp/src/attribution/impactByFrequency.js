import groupBy from 'lodash/groupBy';
import toPairs from 'lodash/toPairs';
import { merge } from 'lodash'

const calculateImpactByFrequency = ({
  mapping,
  getMetricsData,
  initializeImpactForPeriod,
  calculateImpactForPeriod,
  formatPeriod,
  frequency,
  tsRange,
}) => {
  const impactByFrequency = {};

  Object.keys(mapping).forEach(indicator => {
    const grouppedData = groupBy(getMetricsData(indicator), item => frequency.groupPeriod(item, indicator));
    const data = merge(
      grouppedData,
      frequency.getDefaultColumns(tsRange.startTS, tsRange.endTS, () => [])
    );

    Object.keys(data).forEach(dateKey => {
      if (!impactByFrequency[dateKey]) {
        impactByFrequency[dateKey] = initializeImpactForPeriod(mapping);
      }

      data[dateKey].forEach(user => calculateImpactForPeriod(indicator, user, impactByFrequency[dateKey]));
    });
  });

  return toPairs(impactByFrequency)
    .sort((a, b) => a[0] - b[0])
    .map(([timestamp, item]) => ({
      ...formatPeriod(item),
      name: frequency.namePeriod(timestamp),
    }));
}

export default calculateImpactByFrequency;
