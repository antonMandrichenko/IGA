import React from 'react';
import Component from 'components/Component';
import Page from 'components/Page';
import style from 'styles/plan/plan.css';
import pageStyle from 'styles/page.css';
import Toggle from 'components/controls/Toggle';
import UnmappedTab from 'components/pages/settings/channels/tabs/UnmappedTab';

export default class Channels extends Component {

  style = style;
  styles = [pageStyle];

  constructor(props) {
    super(props);
    this.state = {
      selectedTab: 0,
      isOnline: true
    };
  }

  selectTab(index) {
    this.setState({
      selectedTab: index
    });
  }

  getNewCondition = () => {
    return {
      param: '',
      operation: '',
      value: ''
    };
  };

  addRule = (channel, conditions = [this.getNewCondition()], callback) => {
    const {attributionMappingRules} = this.props;
    attributionMappingRules.push({
      conditions,
      channel
    });
    this.props.updateState({attributionMappingRules}, callback);
  };

  render() {
    const {isOnline} = this.state;
    const childrenWithProps = React.Children.map(this.props.children,
      (child) => React.cloneElement(child, {
        ...this.props,
        addRule: this.addRule,
        getNewCondition: this.getNewCondition,
        isOnline
      }));

    const unmappedTab = this.props.children ? this.props.children.type === UnmappedTab : null;

    return <div>
      <Page width="100%">
        <div className={pageStyle.locals.container}>
          <div className={pageStyle.locals.contentHead}>
            <div className={pageStyle.locals.contentHeadTitle}>
              Channels
              <div hidden={!unmappedTab}>
                <Toggle style={{marginLeft: '30px'}}
                        options={[{
                          text: 'Online',
                          value: true
                        },
                          {
                            text: 'Offline',
                            value: false
                          }
                        ]}
                        selectedValue={isOnline}
                        onClick={(value) => {
                          this.setState({isOnline: value});
                        }}/>
              </div>
            </div>
          </div>
          <div>
            {childrenWithProps}
          </div>
        </div>
      </Page>
    </div>;
  }
}
