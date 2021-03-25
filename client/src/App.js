import React, {useState, useEffect} from "react"
import {getWeb3, getContracts} from "./utils"


function App() {
    const [isLoading, setIsLoading] = useState(false)
    const [web3, setWeb3] = useState(null)

    useEffect(() => {
        async function init () {
            setIsLoading(true)
            const web3 = await getWeb3()
            setWeb3(web3)

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
