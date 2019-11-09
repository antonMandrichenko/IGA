import {decorate, observable, action, computed} from 'mobx';
import moment from 'moment';
import {FREQUENCY_VALUES} from 'components/utils/frequency';
import {
  getDayName,
  getMonthName,
  getStartOfDayTimestamp,
  getStartOfMonthTimestamp,
  getStartOfWeekTimestamp, getWeekName
} from 'components/utils/date';

const {MONTH, WEEK, DAY} = FREQUENCY_VALUES;

const timestampGetters = {
  [MONTH]: getStartOfMonthTimestamp,
  [WEEK]: getStartOfWeekTimestamp,
  [DAY]: getStartOfDayTimestamp,
}
const nameGetters = {
  [MONTH]: getMonthName,
  [WEEK]: getWeekName,
  [DAY]: getDayName,
}
const momentUnits = {
  [MONTH]: 'months',
  [WEEK]: 'weeks',
  [DAY]: 'days',
}

class FrequencyStore {
  constructor() {
    this.frequency = MONTH;
  }

  setFrequency(frequency) {
    this.frequency = frequency;
  }

  get control() {
    return {
      selected: this.frequency,
      onChange: (selected) => this.setFrequency(selected.value),
    }
  }

  get groupPeriod() {
    const getTs = timestampGetters[this.frequency]

    return (item, indicator) => getTs(new Date(item.funnelStages[indicator]))
  }

  get namePeriod() {
    return (key) => nameGetters[this.frequency](new Date(+key))
  }

  getDefaultColumns = (startTs, endTs, makeDefaultColumn = () => {}) => {
    const getTs = timestampGetters[this.frequency]
    const startDate = moment(getTs(new Date(startTs)))
    const endDate = moment(getTs(new Date(endTs)))
    const unit = momentUnits[this.frequency]
    const diff = endDate.diff(startDate, unit) + 1;
    const res = {};

    for (let i = 0; i < diff; ++i) {
      const periodTs = moment(startDate)
        .add(i, unit)
        .toDate()
        .getTime()

      res[periodTs] = makeDefaultColumn(periodTs)
    }

    return res
  }
}

decorate(FrequencyStore, {
  frequency: observable.ref,
  setFrequency: action.bound,
  control: computed,
  groupPeriod: computed,
  namePeriod: computed,
});

export default FrequencyStore;
