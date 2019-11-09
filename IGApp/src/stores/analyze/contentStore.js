import {decorate, computed, observable, action} from 'mobx';
import { persist } from 'mobx-persist';
import {get, mapKeys, merge} from 'lodash';

import {contentPageConfig} from 'components/utils/filters/configs';
import {
  makeContentChannelBeforeStageFilter,
  makeContentBeforeStageFilter
} from 'components/utils/filters/make';
import {calculateAttributionPages, calculatePagesImpactByFrequency, initializePage} from 'attribution/pages';
import {calculateChannelsImpact} from 'attribution/channelsImpact';
import {
  calculateAttributionContentCampaigns,
  calculateCampaignsImpactByFrequency,
  getContentFormatPeriod
} from 'attribution/campaigns';
import attributionStore from 'stores/attributionStore';
import userStore from 'stores/userStore';
import FiltersStore from 'stores/analyze/filtersStore';
import journeysStore from 'stores/analyze/journeysStore';
import hydrate from 'stores/hydrate';
import FrequencyStore from 'stores/analyze/frequencyStore';
import {getChannelNickname} from 'components/utils/filters/channels';

const filtersStore = persist(FiltersStore.persistSchema)(new FiltersStore(contentPageConfig));

hydrate('contentFilters', filtersStore);

class ContentStore {
  constructor() {
    this.isContentPages = true;
    this.filtersStore = filtersStore;
    this.frequency = new FrequencyStore();
  }

  setIsContentPages(isContentPages) {
    this.isContentPages = isContentPages;
  }

  get contentChannels() {
    const {usersByEmail, getMetricsData, calculateAttributionWeights} = filtersStore;
    const {userMonthPlan} = userStore;
    const groupByMapping = get(attributionStore, 'data.attribution.groupByMapping', {});

    const channelsImpact = calculateChannelsImpact(
        groupByMapping,
        usersByEmail,
        getMetricsData,
        userMonthPlan,
        calculateAttributionWeights,
        true
    );

    const res = {};

    Object.keys(channelsImpact).forEach((indicator) => {
      const data = channelsImpact[indicator];
      const channels = Object.keys(data);

      channels.forEach((channel) => {
        if (!res[channel]) {
          res[channel] = initializePage(channel, getChannelNickname(channel));
        }

        res[channel][indicator] = data[channel];
      })
    });

    return Object.keys(res).map((channel) => ({
      ...res[channel],
      page: channel,
    }));
  }

  get contentChannelsByFrequency() {
    return attributionStore.getChannelsImpactByFrequency(
        this.frequency,
        (item) => mapKeys(item[attributionStore.conversionIndicator], (_, channel) => getChannelNickname(channel)),
        filtersStore.getMetricsData,
        true
    );
  }

  get contentCampaigns() {
    const {usersByEmail, getMetricsData, calculateAttributionWeights} = filtersStore;
    const {userMonthPlan} = userStore;
    const groupByMapping = get(attributionStore, 'data.attribution.groupByMapping', {});

    const campaigns = calculateAttributionContentCampaigns(
        groupByMapping,
        usersByEmail,
        getMetricsData,
        userMonthPlan,
        calculateAttributionWeights
    );

    return campaigns.map((campaign) => ({
      ...campaign,
      page: campaign.title,
    }))
  }

  get contentCampaignsByFrequency() {
    const {getMetricsDataFiltered, calculateAttributionWeights} = filtersStore;
    const {userMonthPlan} = userStore;
    const {conversionIndicator, tsRange} = attributionStore;
    const groupByMapping = get(attributionStore, 'data.attribution.groupByMapping', {});

    return calculateCampaignsImpactByFrequency(
        groupByMapping,
        getMetricsDataFiltered,
        userMonthPlan,
        calculateAttributionWeights,
        this.frequency,
        tsRange,
        getContentFormatPeriod(conversionIndicator),
        true
    );
  }

  get pages() {
    const {usersByEmail, getMetricsData, calculateAttributionWeights} = filtersStore;
    const {userMonthPlan} = userStore;
    const groupByMapping = get(attributionStore, 'data.attribution.groupByMapping', {});
    const {isContentPages} = this;

    const pages = calculateAttributionPages(
      groupByMapping,
      usersByEmail,
      getMetricsData,
      userMonthPlan,
      calculateAttributionWeights,
      isContentPages ? undefined : 'contentChannel'
    );

    pages.push(...(isContentPages ? this.contentCampaigns :this.contentChannels ));

    return pages;
  }

  get filtersData() {
    return filtersStore.filtersData;
  }

  get pagesImpactByFrequency() {
    const {getMetricsDataFiltered, calculateAttributionWeights} = this.filtersStore;
    const {userMonthPlan} = userStore;
    const {conversionIndicator, tsRange} = attributionStore;
    const groupByMapping = get(attributionStore, 'data.attribution.groupByMapping', {});
    const {isContentPages} = this;

    const pages = calculatePagesImpactByFrequency(
      groupByMapping,
      getMetricsDataFiltered,
      userMonthPlan,
      calculateAttributionWeights,
      isContentPages ? undefined : 'contentChannel',
      this.frequency,
      tsRange,
      (periodData) =>
        Object.values(periodData).reduce((res, item) => {
          const key = isContentPages ? item.title : getChannelNickname(item.channel);
          res[key] = (res[key] || 0) + item[conversionIndicator];

          return res;
        }, {}),
    );

    return merge(pages, isContentPages ? this.contentCampaignsByFrequency : this.contentChannelsByFrequency)
  }

  get filtersData() {
    return filtersStore.filtersData
  }

  navigateToJourneys = (funnelStage, page) => {
    const makeFilterFunc = this.isContentPages
      ? makeContentBeforeStageFilter
      : makeContentChannelBeforeStageFilter;

    journeysStore.navigateWithFilters(
      funnelStage,
      [makeFilterFunc(page, funnelStage), ...filtersStore.rawFilters]
    );
  }
}

decorate(ContentStore, {
  filtersData: computed,
  pages: computed,
  pagesImpactByFrequency: computed,
  contentChannels: computed,
  contentChannelsByFrequency: computed,
  contentCampaigns: computed,
  contentCampaignsByFrequency: computed,
  frequency: observable.ref,
  isContentPages: observable,
  setIsContentPages: action.bound,
});

const schema = {
  isContentPages: true,
};

const store = persist(schema)(new ContentStore());

hydrate('contentStore', store);

export default store;
