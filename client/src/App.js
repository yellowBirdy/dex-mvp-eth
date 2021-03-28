import React, {useState, useEffect} from "react"
import {getWeb3, getContracts} from "./blockchain"

import {Wallet, Orders, Trades} from "./components" 


function App() {
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [web3, setWeb3] = useState(null)
    const [dex, setDex] = useState(null)
    const [coins, setCoins] = useState({})


    async function connect () {
        setIsLoading(true)
        const web3 = await getWeb3()
        const {dexContract, coinContracts} = await getContracts({web3})
        setWeb3(web3)
        setDex(dexContract)
        setCoins(coinContracts)
        setIsLoading(false)
        setIsConnected(true)
    }
    

    return isLoading ? <h1>Connecting to the blockchain</h1> :
           !isConnected ? <h1 onClick={connect}> Click to connect your wallet Ser</h1> : (
        <div className="App">
         DEX
        </div>
    );
}

export default App;
