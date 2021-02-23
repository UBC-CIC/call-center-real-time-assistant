import React from "react";
import {Grid, Segment} from "semantic-ui-react";
import TranscriptBox from "./TranscriptBox";
import KeyPhraseSearcher from "./dropdowns/KeyPhraseSearcher";
import ProcedureSearcher from "./dropdowns/ProcedureSearcher";
import JurisdictionSearcher from "./dropdowns/JurisdictionSearcher";
import SubmitButton from "./buttons/SubmitButton";
import {tickNumber, fakeValues, updateTick, resetTickNumber} from "./FakeDynamicInputs";

export default class AssistantWindow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            transcript: '',
            keyphrases: [],
            procedures: [],
            jurisdictions: []
        }
        this.callerID = 'empty'
        this.timerID = null
        this.enableFeedbackButton = props.enableFeedbackButton
        this.transcriptBox = React.createRef()
        this.keyPhraseDropdown = React.createRef()
        this.procedureDropdown = React.createRef()
        this.jurisdictionDropdown = React.createRef()
        this.submitButton = React.createRef()
        this.updateAssistantWindow = this.updateAssistantWindow.bind(this)
        this.assistantTick = this.assistantTick.bind(this)
        this.tickClearer = this.tickClearer.bind(this)
    }

    updateAssistantWindow (newID) {
        this.callerID = newID
        resetTickNumber()
        this.timerID = setInterval(this.assistantTick, 3000)
    }

    assistantTick() {
        updateTick()
        let transcript = this.getTranscriptFromDynamoDB(this.callerID)
        let keyphrases = this.getKeyphraseFromDynamoDB(this.callerID)
        let procedure = this.getProcedureFromDynamoDB(this.callerID)
        let jurisdiction = this.getJurisdictionFromDynamoDB(this.callerID)

        this.transcriptBox.current.updateTranscript(transcript)
        this.keyPhraseDropdown.current.updateKeyphrases(keyphrases)
        this.procedureDropdown.current.updateProcedure(procedure)
        this.jurisdictionDropdown.current.updateJurisdiction(jurisdiction)

        this.tickClearer()
    }

    getTranscriptFromDynamoDB(callerID) {
        // TODO get actual transcript from DynamoDB
        return fakeValues[callerID][tickNumber][0]
    }

    getKeyphraseFromDynamoDB(callerID) {
        //TODO get actual keyphrases from DynamoDB

        return fakeValues[callerID][tickNumber][1].split(", ")
    }

    putKeyphraseToDynamoDB(callerID) {
        //TODO insert keyphrase into DynamoDB via APIGateway
    }

    getProcedureFromDynamoDB(callerID) {
        //TODO Get actual procedures from DynamoDB

        return fakeValues[callerID][tickNumber][2]
    }


    getJurisdictionFromDynamoDB(callerID) {
        //TODO Get actual procedures from DynamoDB

        return fakeValues[callerID][tickNumber][3]
    }

    tickClearer() {
        //TODO will check if dynamoDB has marked call as complete, and will only clear the ID then
        if (tickNumber === 3) {
            clearInterval(this.timerID)
            this.submitButton.current.toggleButton(true)
        }
    }


    render() {
        return (
            <Grid textAlign='center' columns={3} divided verticalAlign='middle'>
                        <Grid.Column computer={8}>
                            <Segment style={{ minHeight: 300, fontSize: 13}}>
                                <TranscriptBox ref={this.transcriptBox} transcript={''}/>
                            </Segment>
                                <KeyPhraseSearcher ref={this.keyPhraseDropdown}/>
                        </Grid.Column>
                            <Grid.Column verticalAlign={'middle'}>
                                <Segment>
                                    <ProcedureSearcher ref={this.procedureDropdown}/>
                                </Segment>
                                <Segment>
                                    <JurisdictionSearcher ref={this.jurisdictionDropdown}/>
                                </Segment>
                            </Grid.Column>
                    <Grid.Column computer={1}>
                        <SubmitButton ref={this.submitButton}
                                      enableFeedbackButton={this.enableFeedbackButton}/>
                    </Grid.Column>
            </Grid>
        );
    }
}
