import React from 'react';
import {Grid} from "semantic-ui-react";
import Navbar from "../../navbar/Navbar";
import MainApp from "../../MainApp";

function PageContainer(props) {
    return (<Grid className="MainApp" style={{height: '100vh'}}>
        <Navbar/>
        <MainApp/>
    </Grid>)
}

export default PageContainer;