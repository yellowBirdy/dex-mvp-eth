import React, {useState, useEffect} from "react"
import {getWeb3, getContracts} from "./utils"


function App() {
    const [isLoading, setIsLoading] = useState(false)
    const [web3, setWeb3] = useState(null)
    const [dex, setDex] = useState(null)
    const [coins, setCoins] = useState({})

    useEffect(() => {
        async function init () {
            setIsLoading(true)
            const web3 = await getWeb3()
            const {dexContract, coinContracts} = await getContracts({web3})
            setWeb3(web3)
            setDex(dexContract)
            setCoins(coinContracts)
            setIsLoading(false)
        }

        init()
    }, [])
    return isLoading ? <h1>Connect you wallet!!!</h1> : (
        <div className="App">
         DEX
        </div>
    );
}

export default App;
