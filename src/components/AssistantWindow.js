import React from "react";
import {Grid, Message, Segment} from "semantic-ui-react";
import TranscriptBox from "./TranscriptBox";
import KeyPhraseSearcher from "./dropdowns/KeyPhraseSearcher";
import ProcedureSearcher from "./dropdowns/ProcedureSearcher";
import JurisdictionSearcher from "./dropdowns/JurisdictionSearcher";
import SubmitButton from "./buttons/SubmitButton";
import {DynamoDBClient, GetItemCommand} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";
import {DYNAMODB_PING_INTERVAL, END_OF_CALL_STRING, MAX_CHANGELESS_PINGS} from "./Constants";
import {Auth} from "aws-amplify";


export default class AssistantWindow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // transcript: '',
            // keyphrases: [],
            procedureSuggestions: '...',
            // jurisdictions: []
        }
        this.callerID = 'empty'
        this.callEndTime = null
        this.timerID = null
        this.pauseCount = 0
        this.enableFeedbackButton = props.enableFeedbackButton

        // Refs to access child components
        this.transcriptBox = React.createRef()
        this.keyPhraseDropdown = React.createRef()
        this.procedureDropdown = React.createRef()
        this.jurisdictionDropdown = React.createRef()
        this.submitButton = React.createRef()

        // Binding the AssistantWindow instance to its functions
        this.updateAssistantWindow = this.updateAssistantWindow.bind(this)
        this.assistantTick = this.assistantTick.bind(this)
        this.tickClearer = this.tickClearer.bind(this)
        this.resetAssistant = this.resetAssistant.bind(this)
    }

    /**
     * Once a new ID is set in the call dropdown, it resets the autofill dropdowns
     * and starts an interval to fetch data from DynamoDB for the call features
     * @param newID - ID of the call to get details from
     */
    updateAssistantWindow(newID) {
        this.resetAssistant()
        this.callerID = newID
        this.timerID = setInterval(this.assistantTick, DYNAMODB_PING_INTERVAL)
    }

    /**
     * Resets the state of the assistant from any pre-populated values of a previously
     * selected call
     */
    resetAssistant() {
        this.transcriptBox.current.updateTranscript('')
        this.keyPhraseDropdown.current.updateKeyphrases([])
        this.procedureDropdown.current.updateProcedure('')
        this.jurisdictionDropdown.current.updateJurisdiction('')
        this.setState({proceduresPopup: ''})
        this.pauseCount = 0
        this.callEndTime = null
        clearInterval(this.timerID)
    }

    /**
     *
     */
    assistantTick() {
        console.log("still ticking")
        let callQueryParams = {
            TableName: 'contactTranscriptSegments',
            Key: marshall({ContactId: this.callerID})
        }
        let callSearchResultQueryParams = {
            TableName: 'contactDetails',
            Key: marshall({ContactId: this.callerID})
        }
        let that = this
        Auth.currentCredentials()
            .then(credentials => {
                return new DynamoDBClient({
                    region: 'us-west-2',
                    credentials: credentials,
                })
            }).then((dynamoDBClient) => {
            return dynamoDBClient.send(new GetItemCommand(callQueryParams))
        }).then((result) => {
            let callDetails = unmarshall(result.Item)
            if (callDetails['EndTime'] !== that.callEndTime) {
                that.callEndTime = callDetails['EndTime']
                that.transcriptBox.current.updateTranscript(callDetails['Transcript'])
            } else {
                if (that.pauseCount++ === MAX_CHANGELESS_PINGS) {
                    that.transcriptBox.current.updateTranscript(
                        <div>
                            {callDetails['Transcript']}
                            <br/>
                            <br/>
                            <br/>
                            {END_OF_CALL_STRING}
                        </div>
                    )
                    that.tickClearer()
                }
            }
        }).catch(err => {
            console.log(err)
        })

        Auth.currentCredentials()
            .then((credentials) => {
                return new DynamoDBClient({
                    region: 'us-west-2',
                    credentials: credentials,
                })
            }).then((dynamoDBClient) => {
            return dynamoDBClient.send(new GetItemCommand(callSearchResultQueryParams))
        }).then((result) => {
            let searchResults = unmarshall(result.Item)
            if (searchResults['Keyphrases'] !== undefined) {
                that.keyPhraseDropdown.current.updateKeyphrases(Array.from(new Set(searchResults['Keyphrases'])))
            }
            if (searchResults['RecommendedSOP'] !== undefined) {
                that.procedureDropdown.current.updateProcedure(searchResults['RecommendedSOP'].split(',')[0])
                that.setState({procedureSuggestions: searchResults['RecommendedSOP'].toString()})
            }
            if (searchResults['Jurisdiction'] !== undefined && searchResults['Jurisdiction'] !== 'Undetermined') {
                that.jurisdictionDropdown.current.updateJurisdiction(searchResults['Jurisdiction'])
            }
        }).catch((err) => {
            console.log(err)
        })
    }


    /**
     * Stops pinging DynamoDB for data once it has detected that the call is over
     * Also the first step in enabling the feedback button
     *
     * **AssistantWindow.tickClearer()** ->
     *   App.enableFeedbackButton()   ->
     *   FeedbackButton.enableFeedbackButton()
     */
    tickClearer() {
        clearInterval(this.timerID)
        this.enableFeedbackButton()
        console.log("tick has been cleared: " + this.timerID.toString())
    }

    /**
     * Draws a 3 column grid of the transcript box, keyphrases, SOP, jurisdiction dropdowns and a button
     * with hardcoded length values
     * @returns {JSX.Element}
     */
    render() {
        return (
            <Grid textAlign='center' columns={3} divided verticalAlign='middle'>
                <Grid.Column computer={8}>
                    <Segment style={{minHeight: 300, fontSize: 13}}>
                        <TranscriptBox ref={this.transcriptBox} transcript={''}/>
                    </Segment>
                    <KeyPhraseSearcher ref={this.keyPhraseDropdown}/>
                </Grid.Column>
                <Grid.Column>
                    <Message info
                             content={"Recommended SOP's are " + this.state.procedureSuggestions}>
                    </Message>
                    <Segment>
                        <ProcedureSearcher ref={this.procedureDropdown}/>
                    </Segment>
                    <Segment>
                        <JurisdictionSearcher ref={this.jurisdictionDropdown}/>
                    </Segment>
                </Grid.Column>
                <Grid.Column computer={2}>
                    <SubmitButton ref={this.submitButton}
                                  enableFeedbackButton={this.enableFeedbackButton}/>
                </Grid.Column>
            </Grid>
        );
    }
}
