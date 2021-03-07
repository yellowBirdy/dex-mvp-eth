const {expectRevert} = require("@openzeppelin/test-helpers")

const Dex = artifacts.require("Dex.sol");
const Dai = artifacts.require("mocks/Dai.sol");
const Bat = artifacts.require("mocks/Bat.sol");
const Snx = artifacts.require("mocks/Snx.sol");
const Uni = artifacts.require("mocks/Uni.sol");

const tickers = {
    DAI: web3.utils.fromAscii("DAI"),
    BAT: web3.utils.fromAscii("BAT"),
    SNX: web3.utils.fromAscii("SNX"),
    UNI: web3.utils.fromAscii("UNI"),
}

contract("Dex", (accounts) => {
    const [trader1, trader2] = accounts
    let dex, dai, bat, snx, uni
    const initAmount = web3.utils.toWei("10000")
    const amount = web3.utils.toWei("100")
    beforeEach(async () => {
        [dai, bat, snx, uni] = await Promise.all([
            Dai.new(),
            Bat.new(),
            Snx.new(),
            Uni.new()
        ])
        dex = await Dex.new();
        async function fundAccount(acc) {
            await dai.faucet( initAmount, acc,{from: acc})
            await bat.faucet( initAmount, acc,{from: acc})
            await snx.faucet( initAmount, acc,{from: acc})
            await uni.faucet( initAmount, acc,{from: acc})
        }
        
        await Promise.all([
            dex.addToken(tickers.DAI, dai.address),
            dex.addToken(tickers.BAT, bat.address),
            dex.addToken(tickers.SNX, snx.address),
            dex.addToken(tickers.UNI, uni.address)
        ])
    

        fundAccount(trader1)
        fundAccount(trader2)
    })
    describe("Deposit", ()=>{
        it("Deposits registered token", async ()=> {
            await dai.approve(dex.address, amount, {from: trader1})
            await dex.deposit(tickers.DAI, amount, {from: trader1})

            assert((await dex.traderBalances(trader1, tickers.DAI)).toString() === amount)
        })
        it("Does NOT deposit unregisterd token", async ()=> {
            await dai.approve(dex.address, amount, {from:trader1})
            await expectRevert(
                dex.deposit(web3.utils.fromAscii("NOT-registered-TICKER"), amount, {from: trader1}),
                "Dex: Token has to be registered"
            )
        })
    })
    describe("Withdraw", ()=>{
        it("Withdraws registered token", async () => {
            await dai.approve(dex.address, amount, {from: trader1})
            await dex.deposit(tickers.DAI, amount, {from: trader1})

            await dex.withdraw(tickers.DAI, amount, {from: trader1})
            const dexBalance = await dex.traderBalances(trader1, tickers.DAI)
            const walletBalance = await dai.balanceOf(trader1)

            assert(dexBalance.toNumber() === 0 )
            assert(walletBalance.toString() === initAmount)

        })  

        it("Does NOT withdraw not registered token", async () => {
            expectRevert(
                dex.withdraw(web3.utils.fromAscii("Non-exisiting-token"), amount, {from: trader1}),
                "Dex: Token has to be registered"
            )
        })
        it("Does NOT withdraw more then traders balance", async () => {
            await dai.approve(dex.address, amount, {from: trader1})
            await dex.deposit(tickers.DAI, amount, {from: trader1})

            expectRevert(
                dex.withdraw(tickers.DAI, web3.utils.toWei("10000"), {from: trader1}),
                "Dex: Can't withdraw more then one owns"
            )
        })
    })
    describe("Limit", ()=>{
        it("Creates buy order", async () => {
            await dai.approve(dex.address, amount , {from: trader1})
            await dex.deposit(tickers.DAI, amount, {from: trader})

        })
        xit("Creates sell order", async () => {})

        xit("Does NOT create order for not registerred token", async () => {})
        xit("Does NOT create order for DAI", async () => {})
        xit("Does NOT create sell order for more then available balance", async () => {})
        xit("Does NOT create buy order for more the available DAI balance", async () => {})
    })
    describe("Market", ()=>{
    })
})
