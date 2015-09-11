var React = require('react'),
    StateMixin = require('../mixins/app-StateMixin'),
    SearchBox = require('../components/app-SearchBox'),
    Footer = require('../components/app-Footer'),
    AppActions = require('../actions/app-actions'),
    TaskList = require('../components/app-TaskList');

var MainCard = React.createClass({
    mixins: [StateMixin],

    render: function () {
        "use strict";

    var divStyle = {
        'position': 'relative',
        zIndex: 2
    };

        return (
            <div className="card" style={divStyle}>
                <div className="card-main">
                    <div className="card-inner">
                        <p className="card-heading">Time Entries</p>
                        <SearchBox items={this.state.filteredResult}/>
                        <div>
                            <TaskList items={this.state.activeItems} activities={this.state.activities} customFields={this.state.settings.customFields}/>
                        </div>
                    </div>
                    <div className="card-action">         
                        <Footer
                        primaryText="UPDATE"
                        primaryClick={this.props.onUpdateTime}
                        secondaryText="CLEAR"
                        secondaryClick={this.props.onClearEntries}/>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = MainCard;
