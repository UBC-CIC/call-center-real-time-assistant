import React from "react";
import {Button, Grid, Message, Segment} from "semantic-ui-react";
import TranscriptBox from "./TranscriptBox";
import KeyPhraseSearcher from "./dropdowns/KeyPhraseSearcher";
import ProcedureSearcher from "./dropdowns/ProcedureSearcher";
import JurisdictionSearcher from "./dropdowns/JurisdictionSearcher";
import SOPButton from "./buttons/SOPButton";
import {DynamoDBClient, GetItemCommand} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";
import {DYNAMODB_PING_INTERVAL, END_OF_CALL_STRING} from "./Constants";
import config from "../aws-exports";
import {Auth} from "aws-amplify";


export default class AssistantWindow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            firstSOP: '....',
            secondSOP: '....',
            thirdSOP: '....',
            selectedSOP: '',
            procedureSuggestions: '...',
            selectedJurisdiction: ''
        }
        this.assistantState = this.props.stateHolder
        this.callerID = 'empty'
        this.timerID = null
        this.credentials = null
        this.dynamoDBClient = null
        this.procedureDropdownValue = null
        this.enableFeedbackButton = props.enableFeedbackButton

        // Refs to access child components
        this.callerTranscript = React.createRef()
        this.calleeTranscript = React.createRef()
        this.keyPhraseDropdown = React.createRef()
        this.procedureDropdown = React.createRef()
        this.jurisdictionDropdown = React.createRef()
        this.firstSOPButton = React.createRef()
        this.secondSOPButton = React.createRef()
        this.thirdSOPButton = React.createRef()
        this.manualSOPButton = React.createRef()

        // Binding the AssistantWindow instance to its functions

        this.updateAssistantWindow = this.updateAssistantWindow.bind(this)
        this.assistantTick = this.assistantTick.bind(this)
        this.tickClearer = this.tickClearer.bind(this)
        this.resetAssistant = this.resetAssistant.bind(this)
        this.onProcedureDropdownSet = this.onProcedureDropdownSet.bind(this)
        this.onJurisdictionDropdownSet = this.onJurisdictionDropdownSet.bind(this)
        this.onSOPButtonClick = this.onSOPButtonClick.bind(this)
        this.onFetchButtonClick = this.onFetchButtonClick.bind(this)
        this.initialiseDynamoDBClient = this.initialiseDynamoDBClient.bind(this)
        this.initialiseDynamoDBClient().catch(err => console.log("Error in creating dynamo DB: " + err))
    }

    /**
     * Helper function that initialises the DynamoDB client with the logged in user's credentials
     * obtained via Amplify Auth
     * @returns {Promise<void>}
     */
    async initialiseDynamoDBClient() {
        this.credentials = await Auth.currentCredentials()
        this.dynamoDBClient = await new DynamoDBClient({
            region: config.aws_project_region,
            credentials: this.credentials,
        })
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
        this.callerTranscript.current.updateTranscript('')
        this.calleeTranscript.current.updateTranscript('')
        // this.firstSOPButton.current.updateButton('....')
        // this.secondSOPButton.current.updateButton('....')
        // this.thirdSOPButton.current.updateButton('....')
        this.setState({
            firstSOP: '....',
            secondSOP: '....',
            thirdSOP: '....',
            selectedSOP: '',
            selectedJurisdiction: ''
        })
        this.jurisdictionDropdown.current.updateJurisdiction('')
        //this.setState({proceduresPopup: ''})
        clearInterval(this.timerID)
    }

    /**
     * Called on a pre-defined interval to query data from two DynamoDB tables, contactTranscriptSegments
     * and contactDetails. Credentials to authenticate and authorize queries are obtained via Amplify Auth
     * It then updates the necessary TranscriptBox, KeyPhraseSearcher, ProcedureSearcher and JurisdictionSearcher
     * components with the data
     */
    async assistantTick() {
        let callerTranscriptQueryParams = {
            TableName: 'contactTranscriptSegments',
            Key: marshall({ContactId: this.callerID})
        }
        let calleeTranscriptQueryParams = {
            TableName: 'contactTranscriptSegmentsToCustomer',
            Key: marshall({ContactId: this.callerID})
        }
        let callSearchResultQueryParams = {
            TableName: 'contactDetails',
            Key: marshall({ContactId: this.callerID})
        }
        let that = this

        this.dynamoDBClient.send(new GetItemCommand(callerTranscriptQueryParams))
            .then((result) => {
                let callDetails = unmarshall(result.Item)
                if (callDetails['HasCompleted'] === undefined) {
                    that.callEndTime = callDetails['EndTime']
                    that.callerTranscript.current.updateTranscript(callDetails['Transcript'])
                } else {
                    that.assistantState.callerTranscript = callDetails['Transcript']
                    that.callerTranscript.current.updateTranscript(
                        <div>
                            {callDetails['Transcript']}
                            <br/>
                            <br/>
                            {END_OF_CALL_STRING}
                        </div>
                    )
                    that.tickClearer()
                }
            }).catch(err => {
            console.log(err)
        })

        this.dynamoDBClient.send(new GetItemCommand(calleeTranscriptQueryParams))
            .then((result) => {
                let callDetails = unmarshall(result.Item)
                if (callDetails['HasCompleted'] === undefined) {
                    that.callEndTime = callDetails['EndTime']
                    that.calleeTranscript.current.updateTranscript(callDetails['Transcript'])
                } else {
                    that.assistantState.calleeTranscript = callDetails['Transcript']
                    that.calleeTranscript.current.updateTranscript(
                        <div>
                            {callDetails['Transcript']}
                            <br/>
                            <br/>
                            {END_OF_CALL_STRING}
                        </div>
                    )
                }
            }).catch(err => {
            console.log(err)
        })

        this.dynamoDBClient.send(new GetItemCommand(callSearchResultQueryParams))
            .then((result) => {
                let searchResults = unmarshall(result.Item)
                if (searchResults['Keyphrases'] !== undefined) {
                    let keyphraseArray = Array.from(new Set(searchResults['Keyphrases']))
                    that.assistantState.keyphrases = keyphraseArray
                    that.keyPhraseDropdown.current.updateKeyphrases(keyphraseArray)
                }
                if (searchResults['RecommendedSOP'] !== undefined) {
                    let buttonResults = searchResults['RecommendedSOP'].split(',')
                    that.firstSOPButton.current.updateButton(buttonResults[0])
                    that.secondSOPButton.current.updateButton(buttonResults[1])
                    that.thirdSOPButton.current.updateButton(buttonResults[2])

                    that.setState({
                        firstSOP: buttonResults[0],
                        secondSOP: buttonResults[1],
                        thirdSOP: buttonResults[2],
                        procedureSuggestions: searchResults['RecommendedSOP'].toString()
                    })
                    that.assistantState.firstSOP = buttonResults[0]
                    that.assistantState.secondSOP = buttonResults[1]
                    that.assistantState.thirdSOP = buttonResults[2]
                }
                if (searchResults['Jurisdiction'] !== undefined && searchResults['Jurisdiction'] !== 'Undetermined') {
                    that.assistantState.jurisdiction = searchResults['Jurisdiction']
                    that.jurisdictionDropdown.current.updateJurisdiction(searchResults['Jurisdiction'])
                }
            }).catch((err) => {
            console.log(err)
        })
    }


    /**
     * Stops pinging DynamoDB for data once it has detected that the call is over
     * Also the first step in enabling the feedback button
     *  <p/>
     * **AssistantWindow.tickClearer()** ->
     *   App.enableFeedbackButton()   ->
     *   FeedbackButton.enableFeedbackButton()
     */
    tickClearer() {
        clearInterval(this.timerID)
        this.enableFeedbackButton()
        console.log("tick has been cleared: " + this.timerID.toString())
    }

    onProcedureDropdownSet(value) {
        this.setState({selectedSOP: value})
        // this.manualSOPButton.current.updateButton(value)
    }

    onJurisdictionDropdownSet(value) {
        this.setState({selectedJurisdiction: value})
    }

    onSOPButtonClick(event, data) {
        this.setState({selectedSOP: data.children})
    }

    onFetchButtonClick(event, data) {
        console.log(this.state.selectedSOP)
        console.log(this.state.selectedJurisdiction)
    }

    /**
     * Draws a 3 column grid of the transcript box, keyphrases, SOP, jurisdiction dropdowns and a button
     * with hardcoded length values in the Grid.column components
     * @returns {JSX.Element}
     */
    render() {
        return (
            <Grid textAlign='center' columns={3} divided verticalAlign={'middle'}>
                <Grid.Column computer={7}>
                    <Segment style={{minHeight: 180, fontSize: 13}}>
                        <TranscriptBox ref={this.callerTranscript} transcript={'Caller Transcript'}/>
                    </Segment>
                    <Segment style={{minHeight: 180, fontSize: 13}}>
                        <TranscriptBox ref={this.calleeTranscript} transcript={'Call Taker Transcript'}/>
                    </Segment>
                    <KeyPhraseSearcher ref={this.keyPhraseDropdown}/>
                </Grid.Column>
                <Grid.Column computer={5} verticalAlign={'top'}>
                    <Message info content={"Recommended SOP's are:"}/>
                    <Button basic={this.state.firstSOP !== ''}
                            disabled={this.state.firstSOP !== ''}
                            color={'red'} onClick={this.onSOPButtonClick}>
                        {this.state.firstSOP}
                    </Button>
                    <Button basic={this.state.secondSOP !== ''}
                            disabled={this.state.secondSOP !== ''}  color={'red'} onClick={this.onSOPButtonClick}>
                        {this.state.secondSOP}
                    </Button>
                    <Button basic={this.state.thirdSOP !== ''}
                            disabled={this.state.thirdSOP !== ''}  color={'red'} onClick={this.onSOPButtonClick}>
                        {this.state.thirdSOP}
                    </Button>
                    {/*<SOPButton ref={this.firstSOPButton} SOP={'....'} enabled={false}*/}
                    {/*           enableFeedbackButton={this.enableFeedbackButton}/>*/}
                    {/*<SOPButton ref={this.secondSOPButton} SOP={'....'} enabled={false}*/}
                    {/*           enableFeedbackButton={this.enableFeedbackButton}/>*/}
                    {/*<SOPButton ref={this.thirdSOPButton} SOP={'....'} enabled={false}*/}
                    {/*           enableFeedbackButton={this.enableFeedbackButton}/>*/}
                    <Segment>
                        <ProcedureSearcher ref={this.procedureDropdown} onDropdownSet={this.onProcedureDropdownSet}/>
                    </Segment>
                    <Segment>
                        <JurisdictionSearcher ref={this.jurisdictionDropdown} onDropdownSet={this.onJurisdictionDropdownSet}/>
                    </Segment>
                </Grid.Column>
                <Grid.Column computer={4}>
                    <Segment>
                        <Button basic={this.state.selectedSOP === '' || this.state.selectedJurisdiction === ''}
                                disabled={this.state.selectedSOP === ''|| this.state.selectedJurisdiction === ''}
                                color={'red'} onClick={this.onFetchButtonClick}>
                            Fetch SOP Document
                        </Button>
                    {/*<SOPButton ref={this.manualSOPButton} SOP={"Fetch SOP"}*/}
                    {/*           enabled={false} enableFeedbackButton={this.enableFeedbackButton}*/}
                    {/*           jurisdiction={this.selectedJurisdiction}*/}
                    {/*/>*/}
                    </Segment>
                    <Message color={'blue'} content={"Selected SOP: " + this.state.selectedSOP}/>
                    <Message color={'blue'} content={"Selected Jurisdiction: " + this.state.selectedJurisdiction}/>
                </Grid.Column>
            </Grid>
        );
    }
}
