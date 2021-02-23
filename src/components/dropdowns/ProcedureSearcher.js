import React from "react";
import {Dropdown, Transition} from "semantic-ui-react";
import {PROCEDURES} from "../Constants";


export default class ProcedureSearcher extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedValue: '',
            visible: true
        }
        this.procedureOptions = []
        for (let procedure of PROCEDURES) {
            this.procedureOptions.push({
                key: procedure.key,
                value: procedure.key,
                text: procedure.key,
                description: procedure.text
            })
        }
        this.updateProcedure = this.updateProcedure.bind(this)
        this.getSelectedValue = this.getSelectedValue.bind(this)
        this.onChange = this.onChange.bind(this)
        this.toggleVisibility = this.toggleVisibility.bind(this)
    }

    updateProcedure(procedure) {
        this.setState({selectedValue: procedure})
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
                <Dropdown search clearable selection fluid
                          placeholder='SOP'
                          value={this.state.selectedValue}
                          selectOnBlur={false}
                          options={this.procedureOptions}
                          onChange={this.onChange}
                />
            </Transition>

        );
    }
}

