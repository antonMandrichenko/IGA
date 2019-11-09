import React from 'react';
import Component from 'components/Component';
import style from 'styles/onboarding/onboarding.css';
import serverCommunication from 'data/serverCommunication';
import IntegrationPopup from 'components/common/IntegrationPopup';
import PropTypes from 'prop-types';

export default class AuthorizationIntegrationPopup extends Component {

  style = style;

  static defaultProps = {
    haveStepAfterAuthorizationBeforeMapping: false
  };

  static propTypes = {
    haveStepAfterAuthorizationBeforeMapping: PropTypes.bool,
    afterAuthorizationBeforeMappingStep: PropTypes.func,
    nextStep: PropTypes.func
  };

  componentDidMount() {
    if (!this.props.data) {
      serverCommunication.serverRequest('get', this.props.api)
        .then((response) => {
          if (response.ok) {
            response.json()
              .then((data) => {
                this.setState({url: data});
              });
          }
          else if (response.status == 401) {
            history.push('/');
          }
          else {
            console.log('error getting data for api: ' + api);
          }
        });
    }
  }

  open() {
    this.getAuthorization();
  }

  afterAuthorizationBeforeMap = code => {
    if (this.props.haveStepAfterAuthorizationBeforeMapping) {
      this.loadingStarted();
      this.props.afterAuthorizationBeforeMappingStep(code)
        .then(() => {
          this.loadingFinished();
          this.refs.integrationPopup.propogateStep(false);
          this.nextStep()
        });
    }
    else {
      this.afterAuthorization(code);
    }
  };

  nextStep = () => {
    this.props.nextStep()
      .then(data => {
        this.afterAuthorization(data, this.props.fieldKey);
      });
  };

  getAuthorization = () => {
    if (!this.props.data) {
      const win = window.open(this.state.url);
      const timer = setInterval(() => {
        if (win.closed) {
          clearInterval(timer);
          const code = localStorage.getItem('code');
          if (code) {
            localStorage.removeItem('code');
            this.afterAuthorizationBeforeMap(code);
          }
        }
      }, 1000);
    }
    else {
      this.afterAuthorizationBeforeMap(null);
    }
  };

  loadingStarted = () => {
    this.props.loadingStarted && this.props.loadingStarted();
  };

  loadingFinished = () => {
    this.props.loadingFinished && this.props.loadingFinished();
  };

  afterAuthorization = (data, fieldKey = 'code') => {
    this.loadingStarted();
    serverCommunication.serverRequest('post',
      this.props.afterAuthorizationApi || this.props.api,
      JSON.stringify({[fieldKey]: data}),
      localStorage.getItem('region'))
      .then((response) => {
        if (response.ok) {
          response.json()
            .then((data) => {
              this.props.afterDataRetrieved(data)
                .then((showPopup) => {
                  this.loadingFinished();
                  this.refs.integrationPopup.propogateStep(!showPopup);
                })
                .catch((error) => {
                  this.loadingFinished();
                  window.alert(error.message);
                });
            });
        }
        else if (response.status == 401) {
          this.loadingFinished();
          history.push('/');
        }
        else {
          this.loadingFinished();
          window.alert(`Error authorizing connection to ${this.props.platformTitle}`);
        }
      });
  };

  render() {
    return <div style={{width: '100%'}}>
      <IntegrationPopup {...this.props}
                        makeServerRequest={this.props.makeServerRequest}
                        ref="integrationPopup"
                        closeWhileWaitingForRequest={true}
                        platformTitle={this.props.platformTitle}
      >
        {this.props.children}
      </IntegrationPopup>
    </div>;
  }
}
