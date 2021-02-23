import React from "react";
import {Dropdown, Transition} from "semantic-ui-react";
import {JURISDICTIONS} from "../Constants";


export default class JurisdictionSearcher extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedValue: '',
            visible: true
        }
        this.jurisdictionOptions = []
        for (let jurisdiction of JURISDICTIONS) {
            this.jurisdictionOptions.push({
                key: jurisdiction.key, value: jurisdiction.key,
                text: jurisdiction.key, description: jurisdiction.value
            })
        }

        this.updateJurisdiction = this.updateJurisdiction.bind(this)
        this.getSelectedValue = this.getSelectedValue.bind(this)
        this.onChange = this.onChange.bind(this)
        this.toggleVisibility = this.toggleVisibility.bind(this)
    }

    updateJurisdiction(jurisdiction) {
        this.setState({selectedValue: jurisdiction})
        this.toggleVisibility()
    }

    getSelectedValue() {
        return this.state.selectedValue
    }

    onChange(event, data) {
        this.setState({selectedValue: data.value})
    }

    toggleVisibility() {
        this.setState((prevState) => ({visible: !prevState.visible}))
    }

    render() {
        const {visible} = this.state
        return (
            <Transition visible={visible} animation='glow' duration={1500}>
                <Dropdown search fluid selection clearable
                          placeholder='Jurisdiction'
                          value={this.state.selectedValue}
                          selectOnBlur={false}
                          options={this.jurisdictionOptions}
                          onChange={this.onChange}/>
            </Transition>
        );
    }
}
