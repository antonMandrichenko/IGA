import {initializeBaseObject} from './baseObject';
import {aggregateAttributionIndicators, aggregateWeights} from './aggregators';
import calculateImpactByFrequency from 'attribution/impactByFrequency'
import {isContentChannel} from 'components/utils/channels';
import {initializePage} from 'attribution/pages';
import flow from 'lodash/fp/flow';
import mapKeys from 'lodash/fp/mapKeys';
import mapValues from 'lodash/fp/mapValues';
import pickBy from 'lodash/fp/pickBy';

const initializeCampaign = () => {
    const baseObject = initializeBaseObject();
    return {
        ...baseObject,
        channels: []
    };
};

function calculateAttributionCampaigns(mapping, dataByUser, getMetricsData, userMonthPlan, calculateAttributionWeights) {
    const attributionCampaigns = {};

    dataByUser.forEach(user => {

        user.sessions.forEach(session => {
            const isContent = isContentChannel(session.channel);

            if (session.campaign && !isContent) {

                // Initialize
                if (!attributionCampaigns[session.campaign]) {
                    attributionCampaigns[session.campaign] = initializeCampaign();
                }

                // Web visits
                attributionCampaigns[session.campaign].webVisits += 1;
            }
        });
    });

    Object.keys(mapping).forEach(indicator => {

        const data = getMetricsData(indicator);
        data.forEach(user => {
          calculateIndicatorImpact(calculateAttributionWeights,indicator,user,userMonthPlan,attributionCampaigns)
        });
    });
    return Object.keys(attributionCampaigns).map(campaignName => {
        return {
            name: campaignName,
            ...attributionCampaigns[campaignName]
        };
    });
}

function calculateIndicatorImpact(calculateAttributionWeights, indicator, user, userMonthPlan, campaignsImpact) {
    const relevantSessions = user.filterredSessions[indicator] || [];

    // Weights
    const weights = calculateAttributionWeights(
      relevantSessions,
      indicator
    );
    const aggregatedWeights = aggregateWeights(
      relevantSessions.map(session => session.campaign),
      weights
    );

    relevantSessions.forEach(function(session, index) {
      const channel = session.channel;
      const campaign = session.campaign;
      const isContent = isContentChannel(channel);

      if (campaign && !isContent) {
        if(!campaignsImpact[campaign]) {
          campaignsImpact[campaign] = initializeCampaign();
        }
        const { revenueForAccount, accountMRR } = user;

        const aggregatedWeight = aggregatedWeights[campaign];
        delete aggregatedWeights[campaign];

        aggregateAttributionIndicators(
          campaignsImpact[campaign],
          indicator,
          weights,
          index,
          revenueForAccount,
          accountMRR,
          userMonthPlan,
          aggregatedWeight
        );

        if (
          !campaignsImpact[campaign].channels.includes(channel) &&
          channel !== 'direct'
        ) {
          campaignsImpact[campaign].channels.push(channel);
        }

      }
    });
}

const divider = '::::';
const makeContentKey = (channel, campaign) => `${channel}${divider}${campaign}`;

function calculateAttributionContentCampaigns(mapping, dataByUser, getMetricsData, userMonthPlan, calculateAttributionWeights) {
    const attributionCampaigns = {};

    dataByUser.forEach(user => {
        user.sessions.forEach(session => {
            const { channel, campaign } = session;
            const isContent = isContentChannel(channel);

            if (campaign && isContent) {
                const key = makeContentKey(channel, campaign);
                // Initialize
                if (!attributionCampaigns[key]) {
                    attributionCampaigns[key] = initializePage(channel, campaign);
                }

                // Web visits
                attributionCampaigns[key].webVisits += 1;
            }
        });
    });

    Object.keys(mapping).forEach(indicator => {
        const data = getMetricsData(indicator);

        data.forEach(user => {
            calculateContentIndicatorImpact(calculateAttributionWeights,indicator,user,userMonthPlan,attributionCampaigns)
        });
    });

    return Object.keys(attributionCampaigns).map((key) => attributionCampaigns[key]);
}

function calculateContentIndicatorImpact(calculateAttributionWeights, indicator, user, userMonthPlan, campaignsImpact) {
    const relevantSessions = user.filterredSessions[indicator] || [];

    // Weights
    const weights = calculateAttributionWeights(
        relevantSessions,
        indicator
    );
    const aggregatedWeights = aggregateWeights(
        relevantSessions.map(session => makeContentKey(session.channel, session.campaign)),
        weights
    );

    relevantSessions.forEach(function(session, index) {
        const channel = session.channel;
        const campaign = session.campaign;
        const isContent = isContentChannel(channel);

        if (campaign && isContent) {
            const key = makeContentKey(channel, campaign);

            if(!campaignsImpact[key]) {
                campaignsImpact[key] = initializePage(channel, campaign);
            }

            const { revenueForAccount, accountMRR } = user;
            const aggregatedWeight = aggregatedWeights[key];
            delete aggregatedWeights[key];

            aggregateAttributionIndicators(
                campaignsImpact[key],
                indicator,
                weights,
                index,
                revenueForAccount,
                accountMRR,
                userMonthPlan,
                aggregatedWeight
            );
        }
    });
}


const calculateCampaignsImpactByFrequency = (
  mapping,
  getMetricsData,
  userMonthPlan,
  calculateAttributionWeights,
  frequency,
  tsRange,
  formatPeriod,
  forContent = false,
) =>
  calculateImpactByFrequency({
    mapping,
    getMetricsData,
    frequency,
    tsRange,
    formatPeriod,
    initializeImpactForPeriod: () => ({}),
    calculateImpactForPeriod: (indicator, user, impactForPeriod) => {
      const calculator = forContent ? calculateContentIndicatorImpact : calculateIndicatorImpact;

      return calculator(calculateAttributionWeights, indicator, user, userMonthPlan, impactForPeriod);
    },
  });

const getFormatPeriod = (conversionIndicator) => (item) =>
    flow(
        mapKeys((key) => key.replace(/(-|_)/g, ' ')), // transform all -,_ letter to a blank space
        mapValues(campaign => campaign[conversionIndicator]),
        pickBy(value => value)
    )(item);

const getContentFormatPeriod = (conversionIndicator) => (item) => {
    const data = getFormatPeriod(conversionIndicator)(item);
    const res = {};

    Object.keys(data).forEach((key) => {
        const [_, campaign] = key.split(divider);

        res[campaign] = data[key];
    });

    return res;
};

export {
    calculateAttributionCampaigns,
    calculateAttributionContentCampaigns,
    calculateCampaignsImpactByFrequency,
    getFormatPeriod,
    getContentFormatPeriod
}
