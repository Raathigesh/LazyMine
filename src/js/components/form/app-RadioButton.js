/*global require, module*/
/** @jsx React.DOM */
var React = require('react');

var RadioButton = React.createClass({
    propTypes: {
        name: React.PropTypes.string,
        label:  React.PropTypes.string, // label of the radio button
        labelColor: React.PropTypes.string,
        backgoundColor: React.PropTypes.string,
        tooltip: React.PropTypes.string,
        isChecked: React.PropTypes.bool, // color of the radio button's label
        onChange : React.PropTypes.func
    },
    onChange: function(event){
        var isSelected = React.findDOMNode(this.refs.radioButton).checked;

        if (this.props.onChange) {
            this.props.onChange({
                label: this.props.label,
                isSelected: isSelected
            });
        }
       
    },    
    render : function () {
        "use strict";      

        var radioLabelColor = {
          color: this.props.labelColor
        };

        return (
            <div className="radio radio-adv radio-inline" style={radioLabelColor} title={this.props.tooltip}>
                <label for="input-radio-1" >
                    <input ref="radioButton" checked={this.props.isChecked} className="access-hide" id="input-radio-1" name={this.props.name} type="radio" onChange={this.onChange} >
                        {this.props.label}
                    </input>
                    <span className="circle"></span>
                    <span className="circle-check"></span>
                </label>
            </div>
        );
    }
});

module.exports = RadioButton;
