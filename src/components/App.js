import React from 'react';
import '../styles/App.css';
import {Button, Form, Grid, Segment, TextArea} from 'semantic-ui-react';
import AssistantWindow from './AssistantWindow';
import FeedbackButton from "./buttons/FeedbackButton";
import CallWindow from "./CallWindow";
import Amplify from "aws-amplify";
import config from "../aws-exports";
import {withAuthenticator, AmplifySignOut} from "@aws-amplify/ui-react";

Amplify.configure(config);


/**
 * The entire virtual assistant page, contains 4 functionalities in 4 segments.
 * The first allows to pick a live call.
 * The second is the virtual assistant menu with the call features, and the ability to submit SOP and jurisdiction.
 * The third is a post-call feedback button enabled after the call.
 * The fourth is the feedback input segment only brought into view after feedback button click.
 */
class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            calls: [],
            hasCallEnded: false,
            feedbackSegment: <div/>,
            incorrectFeedbackDetailsForm: <div/>
        };

        //Refs to access child components
        this.assistantWindow = React.createRef()
        this.feedbackButton = React.createRef()

        // Binding the App instance to its functions
        this.handleCallerIDSet = this.handleCallerIDSet.bind(this)
        this.enableFeedbackButton = this.enableFeedbackButton.bind(this)
        this.handleFeedbackClick = this.handleFeedbackClick.bind(this)
        this.handleIncorrectFeedback = this.handleIncorrectFeedback.bind(this)
        this.handleIncorrectFeedbackSubmit = this.handleIncorrectFeedbackSubmit.bind(this)
        this.handleAmbiguousFeedback = this.handleAmbiguousFeedback.bind(this)
        this.handleCorrectFeedback = this.handleCorrectFeedback.bind(this)
    }

    /**
     * Called after a callID is set in the call dropdown
     * Used to update the assistant window (a separate component) with call contents and extracted features
     * @param callerID - Call to view information from
     */
    handleCallerIDSet(callerID) {
        this.assistantWindow.current.updateAssistantWindow(callerID)
    }

    /**
     * Second step in enabling the feedback button
     *
     *   SubmitButton.handleClick()   ->
     * **App.enableFeedbackButton()** ->
     *   FeedbackButton.enableFeedbackButton()
     */
    enableFeedbackButton() {
        this.setState({
            hasCallEnded: true
        })
        this.feedbackButton.current.enableFeedbackButton()
    }

    handleFeedbackClick() {
        this.setState({
            feedbackSegment:
                <div>
                    <Segment>
                        <Button color={'orange'} onClick={this.handleIncorrectFeedback}>
                            Prediction is completely off
                        </Button>
                        <Button color={'olive'} onClick={this.handleAmbiguousFeedback}>
                            Prediction is acceptable
                        </Button>
                        <Button color={'green'} onClick={this.handleCorrectFeedback}>
                            Prediction is spot on
                        </Button>
                    </Segment>
                </div>
        });
    }

    handleIncorrectFeedback() {
        this.setState({
            incorrectFeedbackDetailsForm:
                    <Segment>
                        <Form>
                            <TextArea placeholder='Please explain what went wrong'/>
                        </Form>
                        <br/>
                        <Button onClick={this.handleIncorrectFeedbackSubmit}>Submit</Button>
                    </Segment>
        })
    }

    handleIncorrectFeedbackSubmit() {
        //TODO Adds the virtual assistant prediction and Assistant search results to a feedback table
    }

    handleAmbiguousFeedback() {
        // Future developers can expand this to add whatever functionality they wish to add
    }

    handleCorrectFeedback() {
        //TODO Index the current transcript and its prediction results into the search engine
    }

    render() {
        return (
            <div className="App">
                <Grid textAlign='center' style={{height: '100vh'}} verticalAlign='middle'>
                    <Grid.Column style={{maxWidth: 1200}}>
                        <Segment>
                            <CallWindow onCallerIDSet={this.handleCallerIDSet}/>
                        </Segment>
                        <Segment>
                            <AssistantWindow ref={this.assistantWindow}
                                             enableFeedbackButton={this.enableFeedbackButton}/>
                        </Segment>
                        <Segment>
                            <FeedbackButton ref={this.feedbackButton}
                                            buttonEnabled={this.state.hasCallEnded}
                                            onClick={this.handleFeedbackClick}/>
                        </Segment>
                        {this.state.feedbackSegment}
                        {this.state.incorrectFeedbackDetailsForm}
                        <Segment>
                            <AmplifySignOut/>
                        </Segment>
                    </Grid.Column>
                </Grid>
            </div>
        );
    }
}

export default withAuthenticator(App);
