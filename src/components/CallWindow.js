import React from 'react';
import {Button, Dropdown, Grid, Icon} from 'semantic-ui-react';
import {calls} from "./FakeDynamicInputs";

/**
 * UI Component that fetches the list of live calls from DynamoDB, allows selection
 * of a particular call, and forwards that callID to the AssistantWindow for further
 * call information querying
 */
export default class CallWindow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            callDropdownOptions: [],
            handleCallerIDSet: props.onCallerIDSet
        }
        this.callerIDS = []

        this.refreshClick = this.refreshClick.bind(this)
        this.onDropdownValueSet = this.onDropdownValueSet.bind(this)
    }

    getCallerIDS() {
        // TODO: get all the live call ID's from DynamoDB and replace `calls` with it
        return calls
    }

    refreshClick() {
        let callList = this.getCallerIDS()
        callList.forEach(
            ((callerID) => {
                this.callerIDS.push({
                    key: callerID.key,
                    value: callerID.value,
                    text: callerID.value
                })
            }), this
        );
        this.setState({
            callDropdownOptions: this.callerIDS
        });
    }

    onDropdownValueSet(event, data) {
        this.state.handleCallerIDSet(data.value)
    }


    render() {
        return (
            <Grid columns={2} divided textAlign='center'>
                <Grid.Row>
                <Dropdown placeholder='Live Call ID' search selection onChange={this.onDropdownValueSet}
                          options={this.state.callDropdownOptions}/>
                <Button secondary icon onClick={this.refreshClick}>
                    <Icon name={'sync'}/>
                </Button>
                </Grid.Row>
            </Grid>
        );
    }
}