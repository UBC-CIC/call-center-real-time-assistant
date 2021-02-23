import React from "react";
import {Dropdown, Transition} from "semantic-ui-react";


export default class KeyPhraseSearcher extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            dropdownOptions: [],
            selectedValue: ''
        };
        this.suggestedPhrases = []
        this.suggestedOptions = []
        this.manualOptions = []
        this.handleManualKeyphraseAdd = this.handleManualKeyphraseAdd.bind(this)
        this.updateKeyphrases = this.updateKeyphrases.bind(this)
        this.getSelectedValue = this.getSelectedValue.bind(this)
        this.onChange = this.onChange.bind(this)
        this.toggleVisibility = this.toggleVisibility.bind(this)
    }

    handleManualKeyphraseAdd(event, data) {
        this.manualOptions.push({key: data.value, value: data.value, text: data.value})
        this.setState({dropdownOptions: this.suggestedOptions.concat(this.manualOptions)})
    }

    updateKeyphrases(keyphrases) {
        let tempList = []
        for (let phrase of keyphrases) {
            tempList.push({key: phrase, value: phrase, text: phrase})
        }
        this.suggestedOptions = tempList
        this.suggestedPhrases = keyphrases
        this.setState({
            dropdownOptions: this.suggestedOptions.concat(this.manualOptions),
            selectedValue: this.suggestedPhrases
        })
        this.toggleVisibility()
    }

    getSelectedValue() {
        return this.state.selectedValue
    }

    toggleVisibility() {
        this.setState((prevState) => ({visible: !prevState.visible}))
    }

    onChange(event, data) {
        this.setState({selectedValue: data.value})
    }

    render() {
        //TODO Manual search button attached to the dropdown
        //TODO Said button will submit feedback to feedback table
        const {visible} = this.state
        return (
            <Transition visible={visible} animation='glow' duration={1500}>
                <Dropdown fluid multiple search selection scrolling
                          placeholder='Keyphrases'
                          allowAdditions={true}
                          value={this.state.selectedValue}
                          onAddItem={this.handleManualKeyphraseAdd}
                          options={this.state.dropdownOptions}
                          onChange={this.onChange}
                />
            </Transition>
        );
    }
}
