import React from "react";
import {Button} from "semantic-ui-react";


export default class SubmitButton extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            enabled: false
        };
        this.enableFeedbackButton = props.enableFeedbackButton
        this.toggleButton = this.toggleButton.bind(this)
        this.handleClick = this.handleClick.bind(this)
    }

    toggleButton(val) {
        this.setState({
            enabled: val
        })
    }

    /**
     * First step in enabling the feedback button
     *
     * **SubmitButton.handleClick()** ->
     *   App.enableFeedbackButton()   ->
     *   FeedbackButton.enableFeedbackButton()
     */
    handleClick() {
        // TODO Allow the submit button to save mapped procedure somewhere
        this.enableFeedbackButton()
    }

    render() {
        return (
            <Button basic={!this.state.enabled}
                    color={'red'}
                    onClick={this.handleClick}
            >
                Submit
            </Button>
        );
    }
}