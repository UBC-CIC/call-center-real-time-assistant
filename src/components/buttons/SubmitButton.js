import React from "react";
import {Button} from "semantic-ui-react";


export default class SubmitButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            enabled: true
        };
        this.toggleButton = this.toggleButton.bind(this)
        this.handleClick = this.handleClick.bind(this)
    }

    /**
     * Toggles the submit button between enabled and disabled state
     * @param val
     */
    toggleButton(val) {
        this.setState({
            enabled: val
        })
    }

    /**
     * Click handler for the submit button
     */
    handleClick() {
        // TODO Submit button will fetch SOP document via API call from somewhere
    }

    render() {
        return (
            <Button basic={!this.state.enabled}
                    disabled={!this.state.enabled}
                    color={'red'}
                    onClick={this.handleClick}>
                Fetch SOP
            </Button>
        );
    }
}