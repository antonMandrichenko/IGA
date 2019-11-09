import React from 'react';
import Component from 'components/Component';
import Table from 'components/controls/Table';
import Button from 'components/controls/Button';
import MappingRule from 'components/pages/settings/channels/tabs/common/MappingRule';
import ChannelsSelect from 'components/common/ChannelsSelect';
import SaveButton from 'components/pages/profile/SaveButton';
import {isNil} from 'lodash';
import Toggle from 'components/controls/Toggle';
import style from 'styles/settings/channels/unmapped-tab.css';
import {EXTERNAL_LEAD_SOURCE, EXTERNAL_LEAD_SOURCE_DATA1, EXTERNAL_LEAD_SOURCE_DATA2} from 'components/utils/users';
import moment from 'moment';

const conditionStyle = {display: 'flex'};

export const LAST_ACTIVITY_DATE = 'Last Activity Date';

export default class UnmappedTab extends Component {

  style = style;

  constructor(props) {
    super(props);
    this.state = {
      ...this.getInitialState(props),
      isURLsTab: true
    };
  }

  getInitialState = (props) => {
    return {
      conditions: [props.getNewCondition()],
      channel: ''
    };
  };

  updateCondition = (index, param, value) => {
    const conditions = [...this.state.conditions];
    conditions[index][param] = value;
    this.setState({conditions});
  };

  addCondition = () => {
    const conditions = [...this.state.conditions];
    conditions.push(this.props.getNewCondition());
    this.setState({conditions});
  };

  deleteCondition = (index) => {
    let conditions = [...this.state.conditions];
    if (index) {
      conditions.splice(index, 1);
    }
    else {
      // Prevent user for deleting the first condition - initialize it instead
      conditions = [this.props.getNewCondition()];
    }
    this.setState({conditions});
  };

  createUtmConditions = (source, medium) => {
    const conditions = [];
    if (!isNil(source)) {
      conditions.push({
        value: source,
        param: 'source',
        operation: 'equals'
      });
    }
    if (!isNil(medium)) {
      conditions.push({
        value: medium,
        param: 'medium',
        operation: 'equals'
      });
    }
    this.setState({conditions});
  };

  createOfflineConditions = (leadSource, drillDown1, drillDown2) => {
    const conditions = [];
    if (!isNil(leadSource)) {
      conditions.push({
        value: leadSource,
        param: 'external_lead_source',
        operation: 'equals'
      });
    }
    if (!isNil(drillDown1)) {
      conditions.push({
        value: drillDown1,
        param: 'external_lead_source_data1',
        operation: 'equals'
      });
    }
    if (!isNil(drillDown2)) {
      conditions.push({
        value: drillDown2,
        param: 'external_lead_source_data2',
        operation: 'equals'
      });
    }
    this.setState({conditions});
  };

  handleChangeChannel = channel => this.setState({channel});

  addUnknownChannel = (channel) => {
    this.props.addUnknownChannel(channel);
    this.handleChangeChannel(channel);
  };

  formatDate = date => moment(date).format('ll');

  getLastActivityTimeColumn = () => {
    return {
      id: 'last_activity_time',
      header: LAST_ACTIVITY_DATE,
      cell: (row) => this.formatDate(row.last_activity_time),
      sortable: true,
      sortMethod: (a, b) => new Date(a.last_activity_time) - new Date(b.last_activity_time)
    }
  };

  getCountColumn = () => {
    return {
      id: 'Count',
      header: 'Count',
      cell: (row) => parseInt(row.count),
      sortable: true
    }
  };

  render() {
    const {unmappedUrls = [], unmappedUtms = [], unmappedOffline = [], isOnline} = this.props;
    const {conditions, channel, isURLsTab} = this.state;

    const unmappedUrlsColumns = [
      {
        id: 'Referrer',
        header: 'Referrer',
        cell: 'referrer_url',
        sortable: true
      },
      this.getLastActivityTimeColumn(),
      this.getCountColumn(),
      {
        id: 'map',
        header: '',
        cell: (row) => (
          <div>
            <Button type="primary"
                    style={{width: '102px'}}
                    onClick={() => {
                      this.setState({
                        conditions: [{
                          value: row.referrer_url,
                          param: 'referrer',
                          operation: 'contains'
                        }]
                      });
                      this.channelsSelect.focus();
                    }}>
              Map
            </Button>
          </div>
        )
      }
    ];

    const unmappedUtmsColumns = [
      {
        id: 'Source',
        header: 'Source',
        cell: 'utm_source',
        sortable: true
      },
      {
        id: 'Medium',
        header: 'Medium',
        cell: 'utm_medium',
        sortable: true
      },
      this.getLastActivityTimeColumn(),
      this.getCountColumn(),
      {
        id: 'map',
        header: '',
        cell: (row) => (
          <div>
            <Button type="primary"
                    style={{width: '102px'}}
                    onClick={() => {
                      this.createUtmConditions(row.utm_source, row.utm_medium);
                      this.channelsSelect.focus();
                    }}>
              Map
            </Button>
          </div>
        )
      }
    ];

    const unmappedOfflineColumns = [
      {
        id: 'external_lead_source',
        header: EXTERNAL_LEAD_SOURCE,
        cell: 'external_lead_source',
        sortable: true
      },
      {
        id: 'external_lead_source_data1',
        header: EXTERNAL_LEAD_SOURCE_DATA1,
        cell: 'external_lead_source_data1',
        sortable: true
      },
      {
        id: 'external_lead_source_data2',
        header: EXTERNAL_LEAD_SOURCE_DATA2,
        cell: 'external_lead_source_data2',
        sortable: true
      },
      this.getLastActivityTimeColumn(),
      this.getCountColumn(),
      {
        id: 'map',
        header: '',
        cell: (row) => (
          <div>
            <Button type="primary"
                    style={{width: '102px'}}
                    onClick={() => {
                      this.createOfflineConditions(row.external_lead_source, row.external_lead_source_data1, row.external_lead_source_data2);
                      this.channelsSelect.focus();
                    }}>
              Map
            </Button>
          </div>
        )
      }
    ];

    let tableData = unmappedOffline;
    let columns = unmappedOfflineColumns;
    if (isOnline) {
      if (isURLsTab) {
        tableData = unmappedUrls;
        columns = unmappedUrlsColumns;
      }
      else {
        tableData = unmappedUtms;
        columns = unmappedUtmsColumns;
      }
    }

    return <div>
      {isOnline ? <Toggle style={{marginLeft: '15px'}}
                          options={[{
                            text: 'URLs',
                            value: true
                          },
                            {
                              text: 'UTMs',
                              value: false
                            }
                          ]}
                          selectedValue={isURLsTab}
                          onClick={(value) => {
                            this.setState({isURLsTab: value});
                          }}/>
        : null}
      <div style={{marginLeft: -15, marginRight: -15}}>
        <Table
          data={tableData}
          columns={columns}
          showPagination
        />
      </div>
        <span className={this.classes.condition}>If</span>
        {conditions.map((condition, index) =>
          <MappingRule key={index}
                       param={condition.param}
                       operation={condition.operation}
                       value={condition.value}
                       updateOperation={e => this.updateCondition(index, 'operation', e.value)}
                       updateParam={e => this.updateCondition(index, 'param', e.value)}
                       updateValue={e => this.updateCondition(index, 'value', e.target.value)}
                       handleAdd={this.addCondition}
                       handleDelete={() => this.deleteCondition(index)}/>
        )}
      <div style={conditionStyle}>
        <span className={this.classes.condition}>Then</span>
        <ChannelsSelect selected={channel}
                        withOtherChannels
                        ref={ref => this.channelsSelect = ref}
                        onChange={(e) => this.handleChangeChannel(e.value)}
                        style={{width: '277px'}}
                        onNewOptionClick={({value: channel}) => this.addUnknownChannel(channel)}/>
      </div>
      <SaveButton style={{marginTop: '15px', width: 'fit-content'}}
                  onClick={() => {
                    this.setState({saveFail: false, saveSuccess: false});
                    this.setState({saveSuccess: true});
                    this.props.addRule(channel, conditions, () => {
                      this.props.updateUserMonthPlan({
                        attributionMappingRules: this.props.attributionMappingRules
                      }, this.props.region, this.props.planDate);
                    });
                    this.setState({...this.getInitialState(this.props)});
                  }} success={this.state.saveSuccess} fail={this.state.saveFail}/>
    </div>;
  }
};
