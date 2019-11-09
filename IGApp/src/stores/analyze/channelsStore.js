import { decorate, computed, observable } from 'mobx'
import { persist } from 'mobx-persist';
import { get, mapKeys } from 'lodash';
import {channelsPageConfig} from 'components/utils/filters/configs';
import {makeChannelBeforeStageFilter} from 'components/utils/filters/make';
import {calculateChannelsImpact} from 'attribution/channelsImpact';
import attributionStore from 'stores/attributionStore';
import userStore from 'stores/userStore';
import FiltersStore from 'stores/analyze/filtersStore';
import FrequencyStore from 'stores/analyze/frequencyStore';
import journeysStore from 'stores/analyze/journeysStore';
import hydrate from 'stores/hydrate';
import {getChannelNickname} from 'components/utils/filters/channels';

const filtersStore = persist(FiltersStore.persistSchema)(new FiltersStore(channelsPageConfig));

hydrate('channelFilters', filtersStore)

class ChannelsStore {
  constructor() {
    this.filtersStore = filtersStore;
    this.frequency = new FrequencyStore();
  }

  get channelsImpact() {
    const {usersByEmail, getMetricsData, calculateAttributionWeights} = filtersStore;
    const {userMonthPlan} = userStore;
    const groupByMapping = get(attributionStore, 'data.attribution.groupByMapping', {});

    return calculateChannelsImpact(
      groupByMapping,
      usersByEmail,
      getMetricsData,
      userMonthPlan,
      calculateAttributionWeights
    );
  }

  get channelsImpactByFrequency() {
    return attributionStore.getChannelsImpactByFrequency(
      this.frequency,
      (item) => mapKeys(item[attributionStore.conversionIndicator], (_, channel) => getChannelNickname(channel)),
      filtersStore.getMetricsData
    )
  }

  get filtersData() {
    return filtersStore.filtersData
  }

  navigateToJourneys = (funnelStage, channelKey) => {
    journeysStore.navigateWithFilters(
      funnelStage,
      [makeChannelBeforeStageFilter(channelKey, funnelStage), ...filtersStore.rawFilters]
    );
  };
}

decorate(ChannelsStore, {
  channelsImpact: computed,
  channelsImpactByFrequency: computed,
  filtersData: computed,
  frequency: observable.ref,
});

export default new ChannelsStore();
