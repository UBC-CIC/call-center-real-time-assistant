import Amplify from "aws-amplify";
import config from "../aws-exports";
import {withAuthenticator} from "@aws-amplify/ui-react";
import React from "react";
import {BrowserRouter as Router, Switch, Route, Link} from "react-router-dom";
import AssistantApp from "./AssistantApp";
import Feedback from "./Feedback"
import {Button} from "semantic-ui-react";

Amplify.configure(config);

class App extends React.Component {
    render() {
        return (
            <div>
                <Router>
                    <div align={'center'}>
                        <Button attached={"left"}>
                        <Link to="/assistantApp">Assistant App</Link>
                        </Button>
                        <vr/>
                        <Button attached={"right"}>
                        <Link to="/feedbackApp">Feedback App</Link>
                        </Button>
                        <Switch>
                            <Route exact path="/assistantApp">
                                <AssistantApp/>
                            </Route>
                            <Route exact path="/feedbackApp">
                                <Feedback/>
                            </Route>
                        </Switch>
                    </div>
                </Router>
            </div>
        );
    }
}

export default withAuthenticator(App);