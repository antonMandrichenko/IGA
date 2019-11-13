import React from 'react';

import Component from 'components/Component';
import channelRectangleStyle from 'styles/campaigns/channel-rectangle.css';
import {compose} from 'components/utils/utils';
import {inject, observer} from 'mobx-react';

const enhance = compose(
  inject(({attributionStore}) => ({
    attributionStore
  })),
  observer
);

class ChannelRectangle extends Component {

  style = channelRectangleStyle;

  render() {
    return <div className={ this.classes.pure } onClick={ this.props.onClick }>
      <div className={ this.classes.campaignsNumberContainer }>
        {
          this.props.numberOfCampaigns ?
            <div className={this.classes.campaignsNumber}>
              {this.props.numberOfCampaigns}
            </div>
            : null
        }
      </div>
      <div className={ this.classes.icon } data-icon={ this.props.channelIcon }/>
      {this.props.channelTitle} - {this.props.attributionStore.currentCurrency.sign}{this.props.channelBudget.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
    </div>
  }

}

export default enhance(ChannelRectangle);