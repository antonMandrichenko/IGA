import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Select from 'components/controls/Select';
import { FREQUENCY_OPTIONS } from 'components/utils/frequency';

import styles from 'styles/analyze/analyze.css';

const classes = styles.locals;
const { MONTH, DAY, WEEK } = FREQUENCY_OPTIONS;

export default class FrequencySelect extends Component {
  static propTypes = {
    selected: PropTypes.number,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.number.isRequired,
      label: PropTypes.string.isRequired,
    })),
  }

  static defaultProps = {
    selected: MONTH.value,
    options: [DAY, WEEK, MONTH],
  }

  render() {
    return (
      <div className={classes.selectBlock}>
        <div className={classes.selectLabel}>
          Frequency
        </div>
        <Select
          selected={this.props.selected}
          select={{ options: this.props.options }}
          onChange={this.props.onChange}
          style={{ width: '80px', marginLeft: '10px', fontWeight: 500 }}
        />
      </div>
    )
  }
}
