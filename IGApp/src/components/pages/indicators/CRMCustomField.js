import React from 'react';
import Component from 'components/Component';
import salesForceStyle from 'styles/indicators/salesforce-automatic-popup.css';
import CRMStyle from 'styles/indicators/crm-popup.css';
import {get, isEmpty} from 'lodash';
import Label from 'components/ControlsLabel';
import Tooltip from 'components/controls/Tooltip';
import Select from 'components/controls/Select';
import style from 'styles/onboarding/onboarding.css';
import PropTypes from 'prop-types';

export default class CRMCustomField extends Component {

  style = style;
  styles = [salesForceStyle, CRMStyle];

  static propTypes = {
    fieldNum: PropTypes.number,
    data: PropTypes.object,
    customFields: PropTypes.object,
    handleAddCustomField: PropTypes.func,
    handleDeleteCustomField: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {
      lineNum: 1,
      mapping: {
        oppsCustomFields: [],
        accountCustomFields: [],
        contactCustomFields: [],
        leadsCustomFields: []
      },
      objectSelected: {
        first: [],
        second: []
      },
      fieldSelected: {
        first: [],
        second: []
      },
      numOfLines: 1
    };
  }

  handleChangeObject = (event, lineNum) => {
    const objectSelected = {...this.state.objectSelected};
    if (lineNum === 1) {
      objectSelected.first = event.value;
    }
    else {
      objectSelected.second = event.value;
    }
    this.setState({objectSelected});
  };

  handleChangeObjectField = (event, lineNum) => {
    let fieldSelected = {...this.state.fieldSelected};
    const line = lineNum === 1 ? 'first' : 'second';
    fieldSelected[line] = event;
    this.props.handleAddCustomField(this.props.fieldNum, this.state.objectSelected[line], fieldSelected[line]);
    this.setState({fieldSelected});
  };

  getObjectOptions = lineNum => {
    const selectOptions = {
      select: {
        name: 'objects',
        options: []
      }
    };

    const oppOptions = [
      {value: 'oppsCustomFields', label: 'Opportunity'},
      {value: 'accountCustomFields', label: 'Account'},
      {value: 'contactCustomFields', label: 'Contact'}
    ];
    const leadOption = [
      {value: 'leadsCustomFields', label: 'Lead'}
    ];
    const defaultOptions = leadOption.concat(oppOptions);

    if (lineNum === 1) {
      selectOptions.select.options = defaultOptions;
    }
    else {
      switch (this.state.objectSelected.first) {
        case 'oppsCustomFields':
        case 'accountCustomFields':
        case 'contactCustomFields':
          selectOptions.select.options = leadOption;
          break;
        case 'leadsCustomFields':
          selectOptions.select.options = oppOptions;
          break;
      }
    }
    return selectOptions;
  };

  getOptions = optionValue => {
    const optionsArr = get(this.props.customFields, [optionValue], []);
    let options = [];
    if (!isEmpty(optionsArr)) {
      optionsArr.forEach(field => {
        options.push({value: field.name, label: field.label});
      });
    }
    return options;
  };

  getFieldOptions = selected =>
    ({
      select: {
        name: 'field',
        options: this.getOptions(selected)
      }
    });

  deleteLine = () => {
    this.setState({numOfLines: this.state.numOfLines - 1});
    const selected = (isEmpty(this.state.objectSelected.second) || this.state.numOfLines === 1) ? this.state.objectSelected.first : this.state.objectSelected.second;
    this.props.handleDeleteCustomField(this.props.fieldNum, selected);
  };

  addLine = () => {
    this.setState({numOfLines: this.state.numOfLines + 1});
  };

  getNewLine = lineNum => {
    let marginLeft = '';
    let width = '270px';
    let objectSelected = {...this.state.objectSelected};
    let fieldSelected = {...this.state.fieldSelected};
    if (lineNum !== 1) {
      marginLeft = '165px';
      width = '376px';
      objectSelected = objectSelected.second;
      fieldSelected = objectSelected.second;
    }
    else {
      objectSelected = objectSelected.first;
      fieldSelected = fieldSelected.first;
    }

    return <div className={this.classes.row} style={{marginBottom: '10px'}}>
      <div className={this.classes.cols}>
        <div className={salesForceStyle.locals.colLeft} style={{display: 'flex'}}>
          <Label className={salesForceStyle.locals.customLabel} style={{flexGrow: 'initial'}}>Object: </Label>
          <Select {...this.getObjectOptions(lineNum)}
                  selected={objectSelected}
                  onChange={event => {
                    this.handleChangeObject(event, lineNum);
                  }}
                  style={{width: '105px'}}/>
        </div>
        <div className={this.classes.colRight} style={{display: 'flex', width}}>
          <Label className={salesForceStyle.locals.customLabel} style={{width: '65px', marginLeft}}>Field: </Label>
          <Select {...this.getFieldOptions(objectSelected)}
                  selected={fieldSelected}
                  onChange={event => {
                    this.handleChangeObjectField(event.value, lineNum);
                  }}
                  style={{width: '105px'}}/>
          <div className={salesForceStyle.locals.deleteIcon}
               onClick={() => this.deleteLine()}>
          </div>
          {lineNum === 1 ?
            <Tooltip
              tip='If possible, connect the same field from a Contact/Account/Opportunity Object'
              id='add-sync'
            >
              <div className={salesForceStyle.locals.addSyncIcon}
                   onClick={() => this.addLine()}>
              </div>
            </Tooltip>
            : null}
        </div>
      </div>
    </div>;
  };

  render() {
    return <div>
      {this.state.numOfLines === 2 ?
        <React.Fragment>
          {this.getNewLine(1)}
          <div className={this.classes.row} style={{marginBottom: '10px', display: 'flex'}}>
            <div className={salesForceStyle.locals.return}>
            </div>
            {this.getNewLine(2)}
          </div>
        </React.Fragment>
        :
        <React.Fragment>
          {this.state.numOfLines === 1 ?
            this.getNewLine(1)
            : null}
        </React.Fragment>
      }
    </div>;
  }
}
