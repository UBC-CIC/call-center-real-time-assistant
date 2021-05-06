import React from 'react';
import Navbar from "../../navbar/Navbar";
import MainApp from "../../MainApp";

function PageContainer(props) {
    return (
        <div>
            <div>
                <Navbar/>
            </div>
            <hr/>
            <div>
                <MainApp/>
            </div>
        </div>
    )
}

export default PageContainer;