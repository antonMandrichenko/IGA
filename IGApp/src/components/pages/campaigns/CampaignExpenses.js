import React from 'react';
import Component from 'components/Component';
import {getDates} from 'components/utils/date';
import Button from 'components/controls/Button';
import history from 'history';
import {formatExpenses} from 'components/utils/expenses';
import { SmallTable } from 'components/controls/Table';
import {compose} from 'components/utils/utils';
import {inject, observer} from 'mobx-react';

const enhance = compose(
  inject(({attributionStore}) => ({
    attributionStore
  })),
  observer
);

class CampaignExpenses extends Component {

  render() {
    const {planDate, expenses, attributionStore} = this.props;

    const campaignExpenses = expenses.filter(item =>
      item.assignedTo
      && item.assignedTo.entityType === 'campaign'
      && item.assignedTo.entityId === this.props.campaign.index
    );
    const data = campaignExpenses && formatExpenses(campaignExpenses, getDates(planDate), attributionStore.currentCurrency.sign);

    return <div>
      <SmallTable
        data={data}
        columns={[
          {
            id: 'Expense',
            header: 'Expense',
            cell: 'name',
          },
          {
            id: 'Timeframe',
            header: 'Timeframe',
            cell: 'formattedTimeframe',
          },
          {
            id: 'DueDate',
            header: 'Due date',
            cell: 'dueDate',
          },
          {
            id: 'Amount',
            header: 'Amount',
            cell: 'formattedAmount',
          },
        ]}
      />
      <Button type="primary" style={{
        width: '123px',
        marginTop: '30px'
      }} onClick={() => {
        const json = {
          entityType: 'campaign',
          entityId: this.props.campaign.index
        };
        const currentPath = window.location.pathname;
        history.push({
          pathname: '/campaigns/add-expense',
          state: {
            close: () => history.push({
              pathname: currentPath,
              query: {campaign: this.props.campaign.index}
            }),
            assignedTo: json
          }
        });
      }}>
        Add Expense
      </Button>
    </div>;
  }
}

export default enhance(CampaignExpenses);