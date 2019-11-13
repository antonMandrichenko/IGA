import {decorate, computed, observable} from 'mobx';
import { createTransformer } from 'mobx-utils';
import {
  groupBy,
  mapValues,
  merge,
  sumBy,
  flattenDeep,
  get,
  sum,
  toPairs
} from 'lodash';
import moment from 'moment';

import attributionStore from 'stores/attributionStore';
import FrequencyStore from 'stores/analyze/frequencyStore';

import {getTotalImpactByChannel} from 'components/utils/utils';
import {flattenObjectives} from 'components/utils/objective';
import {getRawDatesSpecific} from 'components/utils/date';
import {
  getIndicatorsKeys,
  getMetadata as getIndicatorMetadata,
  newIndicatorMapping
} from 'components/utils/indicators';
import {filterKinds} from 'components/utils/filters';
import {formatBudget} from 'components/utils/budget';
import {getMetadata as getChannelMetadata} from 'components/utils/channels';
import {getStartOfMonthTimestamp} from 'components/utils/date';
import {
  getMarketingVsSales,
  MARKETING_ASSISTED,
  MARKETING_GENERATED,
  NO_MARKETING
} from 'components/utils/users';

class OverviewStore {
  constructor() {
    this.marketingFrequency = new FrequencyStore();
    this.crmFrequency = new FrequencyStore();
    this.indicatorFrequency = new FrequencyStore();
  }

  get stats() {
    const {
      attribution: {channelsImpact} = {},
      calculatedData: {
        daily: {total: dailyTotalCost, indicatorsDataPerDay} = {},
        historyData: {
          totalActualCost: monthlyTotalCost,
          historyDataWithCurrentMonth: {
            indicators: indicatorsWithCurrentMonth
          } = {}
        } = {}
      } = {}
    } = attributionStore.data;
    const {
      customDateMode,
      monthsExceptThisMonth
    } = attributionStore.timeFrame;

    const indicatorsInRelevantMonths = indicatorsWithCurrentMonth.slice(
      -(monthsExceptThisMonth + 1)
    );
    const totalCost = customDateMode ? dailyTotalCost : monthlyTotalCost;
    const totalPipeline = getTotalImpactByChannel(channelsImpact.pipeline);
    const totalRevenue = getTotalImpactByChannel(channelsImpact.revenue);
    let costPerFunnel = {};

    const calcCostPerFunnel = data =>
      Object.keys(newIndicatorMapping).map(indicator => {
        const newIndicator = newIndicatorMapping[indicator];
        const indicatorSum = sumBy(
          data,
          item => item[newIndicator] || 0
        );
        costPerFunnel[indicator] = indicatorSum
          ? formatBudget(Math.round(totalCost / indicatorSum), false, attributionStore.currentCurrency.sign)
          : '-';
      });

    calcCostPerFunnel(
      customDateMode ? indicatorsDataPerDay : indicatorsInRelevantMonths
    );

    return {
      totalPipeline,
      totalRevenue,
      totalCost,
      costPerFunnel
    };
  }

  getCategoryData = createTransformer((indicator) => {
    return attributionStore.getChannelsImpactByFrequency(
      this.marketingFrequency,
      ((item) => {
        const obj = {};

        if (item[indicator]) {
          Object.keys(item[indicator]).forEach(channel => {
            const category =
              getChannelMetadata('category', channel) || 'Direct';
            const value = item[indicator][channel];
            if (value) {
              if (!obj[category]) {
                obj[category] = 0;
              }
              obj[category] += value;
            }
          });
        }

        return obj;
      })
    );
  });

  get flattenHistoryObjectives() {
    const {
      historyData: {objectives, indicators} = {},
      planDate
    } = attributionStore.data;

    return flattenObjectives(
      objectives,
      indicators,
      getRawDatesSpecific(planDate, objectives.length, 0),
      [],
      [],
      false
    );
  }

  getHistoricalData(indicator) {
    return computed(() => {
      const {
        calculatedData: {
          daily: {indicatorsDataPerDay} = {},
          historyData: {
            months,
            historyDataWithCurrentMonth: {
              actualIndicatorsDaily
            } = {}
          } = {}
        } = {}
      } = attributionStore.data;
      const {customDateMode} = attributionStore.timeFrame;

      const indicatorsKeys = getIndicatorsKeys();

      let grow = {};
      let indicatorData;
      let performanceData;
      const indicatorsData = {};


      if (customDateMode) {
        indicatorsDataPerDay.forEach(item => {
          indicatorsKeys.forEach(indicator => {
            if (!indicatorsData[indicator]) {
              indicatorsData[indicator] = [];
            }

            const value = item[indicator];

            indicatorsData[indicator].push({
              name: item.name,
              value: value && value > 0 ? value : 0
            });
          });
        });

        indicatorData = indicatorsData[indicator];

        if (indicatorData) {
          const indicatorDataWithValue = indicatorData.filter(item =>
            Boolean(item && item.value)
          );

          if (indicatorDataWithValue.length < 2) {
            // not enough data to show growth,
            // treat it as if there's no growth (hide it)
            grow = {
              value: 0
            };
          }
          else {
            if (getIndicatorMetadata('isRefreshed', indicator)) {
              grow = {
                value: sum(
                  indicatorDataWithValue.map(
                    data => data.value
                  )
                ),
                percentage: null,
                isRefreshed: true
              };
            }
            else {
              const current =
                indicatorDataWithValue[
                indicatorDataWithValue.length - 1
                  ].value;
              const previous = indicatorDataWithValue[0].value;
              grow = {
                value: current - previous,
                percentage: previous
                  ? Math.round(
                    ((current - previous) / previous) *
                    100
                  )
                  : Infinity,
                isRefreshed: false
              };
            }
          }
        }

        performanceData = indicatorsData[indicator] || [];
      }
      else {
        const currentDay = new Date().getDate();

        actualIndicatorsDaily.forEach((item, key) => {
          const isCurrentMonth =
            key === actualIndicatorsDaily.length - 1;
          const monthString = months[key];

          if (isCurrentMonth) {
            item = item.slice(0, currentDay);
          }

          item.forEach((month = {}, index) => {
            const displayDate = index
              ? `${index + 1} ${monthString}`
              : monthString;
            indicatorsKeys.forEach(indicator => {
              if (!indicatorsData[indicator]) {
                indicatorsData[indicator] = [];
              }
              const value = month[indicator];
              indicatorsData[indicator].push({
                name: displayDate,
                value: value && value > 0 ? value : 0
              });
            });
          });
        });

        indicatorData = indicatorsData[indicator];

        if (indicatorData) {
          const relevantIndicatorData = indicatorData.slice(
            months || 0,
            indicatorData.length
          );
          if (getIndicatorMetadata('isRefreshed', indicator)) {
            grow = {
              value: sum(
                relevantIndicatorData.map(data => data.value)
              ),
              percentage: null,
              isRefreshed: true
            };
          }
          else {
            const current =
              relevantIndicatorData[
              relevantIndicatorData.length - 1
                ].value;
            const previous = relevantIndicatorData[0].value;
            grow = {
              value: current - previous,
              percentage: previous
                ? Math.round(
                  ((current - previous) / previous) * 100
                )
                : Infinity,
              isRefreshed: false
            };
          }
        }

        performanceData = indicatorsData[indicator]
          ? indicatorsData[indicator].slice(months)
          : [];
      }

      return {
        grow,
        performanceData
      };
    }).get();
  }

  getCrmData = ({filters, groupBy: groupByField, indicator}) => {
    return computed(() => {
      const {
        CRMConfig: {
          dataCustomFilters,
          isCountByOpps,
          customFieldsNicknames
        } = {},
        userAccount: {permissions} = {}
      } = attributionStore.data;
      const {startTS, endTS} = attributionStore.tsRange;
      const {getDefaultColumns, groupPeriod, namePeriod} = this.crmFrequency;

      const getGroupByDataFiltered = indicator =>
        attributionStore
          .getMetricDataByMapping(indicator)
          .filter(
            item =>
              item.funnelStages[indicator] &&
              moment(item.funnelStages[indicator]).isBetween(
                startTS,
                endTS
              )
          );

      const addDefaultColumns = grouppedData =>
        merge(grouppedData, getDefaultColumns(startTS, endTS, () => []));

      const customFilter = new Function(
        'item',
        dataCustomFilters || 'return true'
      );

      const calcCrmSessions = dateItems => {
        return dateItems.reduce((acc, {revenue, sessions}) => {
          const crmSession = sessions.find(session => session.isCRM);

          if (crmSession) {
            crmSession.revenue = revenue;
          }

          const isFiltered =
            customFilter(crmSession) &&
            filters.every(filter => filter.assert(crmSession));

          if (isFiltered) {
            acc.push(crmSession);
          }

          return acc;
        }, []);
      };

      const calcCrmItem = crmSessions => {
        return mapValues(groupBy(crmSessions, groupByField), users => {
          if (isCountByOpps) {
            return users.reduce(
              (sum, user) =>
                sum + (Object.keys(user.revenue).length || 1),
              0
            );
          }
          else {
            return users.length;
          }
        });
      };

      const getCRMSessionsByPeriod = indicator =>
        toPairs(
          addDefaultColumns(
            groupBy(getGroupByDataFiltered(indicator), item => groupPeriod(item, indicator))
          )
        ).sort((a, b) => a[0] - b[0]);

      const crmSessionsByPeriod = getCRMSessionsByPeriod(indicator);
        // this is to get all possibilities
        // metric options contains all indicators
      const allCrmSessionsByPeriod = flattenDeep(
          attributionStore.metricsOptions.map(option =>
            getCRMSessionsByPeriod(option.value).map(([_, item]) => calcCrmSessions(item))
          )
      );
      const data = crmSessionsByPeriod
        .map(([key, item]) => ({
          ...calcCrmItem(calcCrmSessions(item)),
          name: namePeriod(key),
        }));

      const filterConfigs = [];
      const getFilterOptions = (data, keys) => {
        const initialFilters = keys.map(_ => []);

        return data.reduce((acc, curr) => {
          keys.forEach((key, idx) => {
            const option = get(curr, key);

            if (option && !acc[idx].includes(option)) {
              acc[idx].push(option);
            }
          });

          return acc;
        }, initialFilters);
      };
      if (customFieldsNicknames.length) {
        const customFieldsKeys = [];
        for (let i = 1; i <= customFieldsNicknames.length; i++) {
          customFieldsKeys.push(`custom${i}`);
        }

        const customOptions = getFilterOptions(
          allCrmSessionsByPeriod,
          customFieldsKeys
        );

        filterConfigs.push({
          kind: filterKinds.CUSTOM_FIELDS,
          options: customOptions,
          fieldKey: customFieldsKeys,
          fieldNames: customFieldsNicknames
        });
      }

      if (permissions.CRMLeadSource) {
        const CRMSourcesOptions = getFilterOptions(allCrmSessionsByPeriod, [
          'external_lead_source',
          'external_lead_source_data1',
          'external_lead_source_data2'
        ]);

        filterConfigs.push({
          kind: filterKinds.CRMSource,
          options: CRMSourcesOptions,
          fieldKey: [
            'external_lead_source',
            'external_lead_source_data1',
            'external_lead_source_data2'
          ],
          fieldNames: [
            'CRM lead source',
            'CRM lead source details 1',
            'CRM lead source details 2'
          ]
        });
      }

      return {
        data,
        filterConfigs
      };
    }).get();
  }

  getImpactData = (indicator) => {
    return computed(() => {
      const {startTS, endTS} = attributionStore.tsRange;
      const {getDefaultColumns, groupPeriod, namePeriod} = this.indicatorFrequency;
      const calcImpactData = (
        touchPointsByPeriod,
        filterFn = () => true
      ) => {
        const keys = Object.keys(touchPointsByPeriod);

        return Object.values(touchPointsByPeriod)
          .map((period, index) => {
            const periodKey = Number(keys[index]);

            return period.reduce(
              (object, item) => {
                if (item.isMarketingGenerated) {
                  object[MARKETING_GENERATED] += 1;
                }
                else if (item.isMarketingAssisted) {
                  object[MARKETING_ASSISTED] += 1;
                }
                else {
                  object[NO_MARKETING] += 1;
                }
                return object;
              },
              {
                [MARKETING_GENERATED]: 0,
                [MARKETING_ASSISTED]: 0,
                [NO_MARKETING]: 0,
                period: periodKey,
                name: namePeriod(periodKey)
              }
            );
          })
          .filter(filterFn)
          .sort((a, b) => a.period - b.period)
          .map(({period, ...item}) => item);
      };

      const getFirstTouchPoints = data =>
        data
          .filter(item => item.funnelStages[indicator])
          .map(item => ({
            ...getMarketingVsSales(item),
            funnelStages: item.funnelStages
          }));

      const getGroupByDataFiltered = indicator =>
        attributionStore
          .getMetricDataByMapping(indicator)
          .filter(
            item =>
              item.funnelStages[indicator] &&
              moment(item.funnelStages[indicator]).isBetween(
                startTS,
                endTS
              )
          );

      const firstTouchPoints = getFirstTouchPoints(
        getGroupByDataFiltered(indicator)
      );

      const addDefaultColumns = grouppedData =>
        merge(grouppedData, getDefaultColumns(startTS, endTS, () => []));

      return calcImpactData(
        addDefaultColumns(
          groupBy(firstTouchPoints, item => groupPeriod(item, indicator))
        ),
      );
    }).get();
  }
}

decorate(OverviewStore, {
  flattenHistoryObjectives: computed,
  stats: computed,
  marketingFrequency: observable,
  crmFrequency: observable,
  indicatorFrequency: observable,
});

export default new OverviewStore();
