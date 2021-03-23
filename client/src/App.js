import React, {useState, useEffect} from "react"
import {getWeb3, getContracts} from "./utils"


function App() {
    async function init () {
         const web3 = await getWeb3()
    
        alert (web3)
    }

    init()
    return (
        <div className="App">
         DEX
        </div>
    );
}

export default App;
