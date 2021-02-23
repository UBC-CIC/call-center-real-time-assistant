import React from 'react';
import '../styles/App.css';
import {Form, Grid, Segment, TextArea} from 'semantic-ui-react';
import AssistantWindow from './AssistantWindow';
import FeedbackButton from "./buttons/FeedbackButton";
import CallWindow from "./CallWindow";

/**
 * The entire virtual assistant page, contains 4 functionalities in 4 segments.
 * The first allows to pick a live call.
 * The second is the virtual assistant menu with the call features, and the ability to submit SOP and jurisdiction.
 * The third is a post-call feedback button enabled after the call.
 * The fourth is the feedback text box only brought into view after feedback button click.
 */
class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            calls: [],
            currentCallerID: 'empty',
            submitted: false,
            feedbackForm: <div/>
        };
        this.assistantWindow = React.createRef()
        this.feedbackButton = React.createRef()
        this.handleCallerIDSet = this.handleCallerIDSet.bind(this)
        this.handleFeedbackClick = this.handleFeedbackClick.bind(this)
        this.enableFeedbackButton = this.enableFeedbackButton.bind(this)
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
            submitted: true
        })
        this.feedbackButton.current.enableFeedbackButton()
    }

    /**
     * Draws a text-box for feedback input after the feedback button is clicked in the 4th segment
     */
    handleFeedbackClick() {
        // TODO should also render and enable a submit button
        this.setState({
            feedbackForm:
                <Segment>
                    <Form>
                        <TextArea placeholder='Enter Feedback'/>
                    </Form>
                </Segment>
        });
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
                                            buttonEnabled={this.state.submitted}
                                            onClick={this.handleFeedbackClick}/>
                        </Segment>
                        {/*// TODO Feedback Window*/}
                        {this.state.feedbackForm}
                    </Grid.Column>
                </Grid>
            </div>
        );
    }
}

export default App;
