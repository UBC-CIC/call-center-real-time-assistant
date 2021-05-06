import Amplify from "aws-amplify";
import config from "../aws-exports";
import React from "react";
import {BrowserRouter as Router, Switch, Route, Link} from "react-router-dom";
import AssistantApp from "./assistantApp/AssistantApp";
import Feedback from "./feedbackApp/Feedback"
import {Menu} from "semantic-ui-react";

Amplify.configure(config);

export default class MainApp extends React.Component {
    render() {
        let navbarState = ''
        return (
            <div>
                <Router>
                    <div align={'center'}>
                        <Menu widths={4}>
                            <Menu.Item
                                active={navbarState === 'Assistant MainApp'}
                                color={'blue'}
                            >
                                <Link to="/assistantApp/">Assistant App</Link>
                            </Menu.Item>
                            <Menu.Item
                                active={navbarState === 'Feedback MainApp'}
                                color={'red'}
                            >
                                <Link to="/feedbackApp/">Feedback App</Link>
                            </Menu.Item>
                        </Menu>
                        <Switch>
                            <Route exact path="/assistantApp/">
                                <AssistantApp/>
                            </Route>
                            <Route exact path="/feedbackApp/">
                                <Feedback/>
                            </Route>
                        </Switch>
                    </div>
                </Router>
            </div>
        );
    }
}
