import Web3 from "web3"


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

export const getContracts = () => {
}
