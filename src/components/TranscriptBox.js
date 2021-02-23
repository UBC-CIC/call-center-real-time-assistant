import React from 'react';
import {Transition} from "semantic-ui-react";

export default class TranscriptBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: true,
            boxData:
                <div>
                    Please select a call
                </div>
        };

        this.toggleVisibility = this.toggleVisibility.bind(this)
        this.updateTranscript = this.updateTranscript.bind(this)
    }

    toggleVisibility() {
        this.setState((prevState) => ({visible: !prevState.visible}))
    }

    updateTranscript(newTranscript) {
        this.setState({
            boxData: newTranscript
        })
        this.toggleVisibility()
    }


    render() {
        const {visible} = this.state
        return (
            <Transition visible={visible} animation='glow' duration={1500}>
                <div>
                    {this.state.boxData}
                </div>
            </Transition>
        );
    }
}
