/*global require, module*/
/** @jsx React.DOM */
var React = require('react'),
    AppStore = require('../stores/app-base-store'),
    AppActions = require('../actions/app-actions'),
    Header = require('../components/app-Header'),
    WalkThrough = require('../components/app-WalkThrough'),
    Router = require('react-router'),
    TextField = require('../components/form/app-TextField'),
    AuthMixin = require('../mixins/app-AuthMixin'),
    StateMixin = require('../mixins/app-StateMixin');

var Settings = React.createClass({
    mixins: [AuthMixin, StateMixin],
    contextTypes: {
        router: React.PropTypes.func
    },
    _login: function () {
        "use strict";
        var url = this.refs.url.getValue(),
            apiKey = this.refs.apiKey.getValue();

        AppActions.saveSettings(url, apiKey);
    },
    render : function () {
        "use strict";
        return (
            <div>
                <Header />
				<div className="col-xs-8 col-xs-offset-2 col-sm-8 col-sm-offset-2 col-md-4 col-md-offset-4 col-lg-4 col-lg-offset-4">
					<div className="card-wrap login-card-wrap">
						<div className="card">
							<div className="card-main">
								<div className="card-inner">
									<p className="text-center login-avatar-wrapper">
										<span className="avatar avatar-inline avatar-lg">
											<img alt="Login" src="assets/logo.png"></img>
										</span>
									</p>
									<form className="form" action="index.html">
										<TextField ref="url" label = "Redmine URL" />
										<TextField ref="apiKey" label = "API Key" />
										<div className="form-group">
											<div className="row">
												<div className="col-md-10 col-md-push-1">
													<a className="btn btn-block btn-lazy waves-button waves-effect waves-light" onClick={this._login}>Connect</a>
												</div>
                                                <div className="col-md-10 col-md-push-1 text-center">
                                                    <WalkThrough />
                                                </div>
											</div>
										</div>
									</form>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
});

module.exports = Settings;
