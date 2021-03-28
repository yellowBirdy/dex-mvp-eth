import Web3 from "web3"
//import ERC20Abi from "./ERC20Abi.json"
import ERC20 from "../contracts/ERC20"
import Dex from "../contracts/Dex"



export const getWeb3 = () => {
    return new Promise((resolve, reject) => { 
        window.addEventListener("load", async () => {
            if (window.ethereum) {
                const web3 = new Web3(window.ethereum)
                try {
                    //await window.ethereum.enable()
                    
                    await window.ethereum.send('eth_requestAccounts')
                    resolve(web3)
                } catch (err){
                    reject(err)
                }
            } else if (window.web3) {
                console.log("Injected web3 detected")
                resolve( window.web3 )
            } else {
                const provider = new Web3.providers.HttpProvider(
                  "http://localhost:9545"
                );
                const web3 = new Web3(provider);
                console.log("No web3 instance injected, using Local web3.");
                resolve(web3);
            }
        })
    })
}

export const getContracts = async ({web3}) => {
    let dexContract,
        coinContracts = {}
    // populate 
    const netId = await web3.eth.net.getId()
    try {
        const address = Dex.networks[netId].address
        dexContract = new web3.eth.Contract(Dex.abi, address)
    } catch (e) {
        throw "DEX contract not found deployed on the network"        
    }
    const tokens = await dexContract.methods.getTokens()
        .call()
    tokens.forEach(({ticker, tokenAddress}) => {
        coinContracts[web3.utils.hexToUtf8(ticker)] =
            new web3.eth.Contract(ERC20.abi, tokenAddress)
    })

    return {dexContract, coinContracts}
}
