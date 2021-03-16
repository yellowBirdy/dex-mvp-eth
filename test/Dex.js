const {expectRevert} = require("@openzeppelin/test-helpers")

const Dex = artifacts.require("Dex.sol");
const Dai = artifacts.require("mocks/Dai.sol");
const Bat = artifacts.require("mocks/Bat.sol");
const Snx = artifacts.require("mocks/Snx.sol");
const Uni = artifacts.require("mocks/Uni.sol");

const Ticker = {
    DAI: web3.utils.fromAscii("DAI"),
    BAT: web3.utils.fromAscii("BAT"),
    SNX: web3.utils.fromAscii("SNX"),
    UNI: web3.utils.fromAscii("UNI"),
}

const Side = {
    BUY: 0,
    SELL: 1
}

contract("Dex", (accounts) => {
    const [trader1, trader2] = accounts
    let dex, dai, bat, snx, uni
    const initAmount = web3.utils.toWei("10000")
    const amount = web3.utils.toWei("100")
    const biggerAmount = web3.utils.toWei("1000")
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
            dex.addToken(Ticker.DAI, dai.address),
            dex.addToken(Ticker.BAT, bat.address),
            dex.addToken(Ticker.SNX, snx.address),
            dex.addToken(Ticker.UNI, uni.address)
        ])
    

        await fundAccount(trader1)
        await fundAccount(trader2)
    })
    describe("Deposit", ()=>{
        it("Deposits registered token", async ()=> {
            await dai.approve(dex.address, amount, {from: trader1})
            await dex.deposit(Ticker.DAI, amount, {from: trader1})

            assert((await dex.traderBalances(trader1, Ticker.DAI)).toString() === amount)
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
            await dex.deposit(Ticker.DAI, amount, {from: trader1})

            await dex.withdraw(Ticker.DAI, amount, {from: trader1})
            const dexBalance = await dex.traderBalances(trader1, Ticker.DAI)
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
            await dex.deposit(Ticker.DAI, amount, {from: trader1})

            expectRevert(
                dex.withdraw(Ticker.DAI, web3.utils.toWei("10000"), {from: trader1}),
                "Dex: Can't withdraw more then one owns"
            )
        })
    })
    describe("Limit", ()=>{
        it("Creates buy order", async () => {
            await dai.approve(dex.address, amount , {from: trader1})
            await dex.deposit(Ticker.DAI, amount, {from: trader1})
            
            const buyAmount = web3.utils.toWei("10")
            const price = "1"
            await dex.createLimitOrder(Ticker.BAT, Side.BUY, buyAmount, price,   {from: trader1})
            
            const orders = await dex.getOrders(Ticker.BAT, Side.BUY )
            
            assert(orders.length === 1)
            assert(orders[0].amount === buyAmount)
            assert(orders[0].price  === price)
            assert(orders[0].side  === Side.BUY)
            assert(orders[0].filled === "0")
            assert(orders[0].trader === trader1)

        })
        it("Creates sell order", async () => {
            await bat.approve(dex.address, amount , {from: trader1})
            await dex.deposit(Ticker.BAT, amount, {from: trader1})
            
            const sellAmount = web3.utils.toWei("10")
            const price = "10"
            await dex.createLimitOrder(Ticker.BAT, Side.SELL, sellAmount, price,   {from: trader1})
            
            const orders = await dex.getOrders(Ticker.BAT, Side.SELL )
            
            assert(orders.length === 1)
            assert(orders[0].amount === sellAmount)
            assert(orders[0].price  === price)
            assert(orders[0].side  === Side.SELL)
            assert(orders[0].filled === "0")
            assert(orders[0].trader === trader1)

        })


        it("Does NOT create order for not registerred token", async () => {
            expectRevert(
                dex.createLimitOrder(web3.utils.fromAscii("Does not exist"), Side.SELL, amount, "10", {from: trader1}),
                    "Dex: Token has to be registered"
            )         
        })
        it("Does NOT create order for DAI", async () => {
            expectRevert(
                dex.createLimitOrder(Ticker.DAI, Side.SELL, amount, "10", {from: trader1}),
                "Dex: Can't crate order for DAI"
            )         
            
        })
        it("Does NOT create sell order for more then available balance", async () => {
            await bat.approve(dex.address, amount , {from: trader1})
            await dex.deposit(Ticker.BAT, amount, {from: trader1})
            
            const sellAmount = web3.utils.toWei("101")
            const price = "10"
            expectRevert(
                dex.createLimitOrder(Ticker.BAT, Side.SELL, sellAmount, price,   {from: trader1}),
                "Dex: not enough balance"
            )
        })
        it("Does NOT create buy order for more the available DAI balance", async () => {
            await dai.approve(dex.address, amount , {from: trader1})
            await dex.deposit(Ticker.DAI, amount, {from: trader1})
            
            const buyAmount = web3.utils.toWei("101")
            const price = "10"
            expectRevert(
                dex.createLimitOrder(Ticker.BAT, Side.BUY, buyAmount, price,   {from: trader1}),
                "Dex: not enough DAI balance"
            )
        })
    })
    describe("Market", ()=>{
        it("Creates a buy order", async () => {
            const biggerAmount = web3.utils.toWei("1000");
            await bat.approve(dex.address, biggerAmount , {from: trader2})
            await dex.deposit(Ticker.BAT, biggerAmount, {from: trader2})
           
            await dex.createLimitOrder(Ticker.BAT, Side.SELL, biggerAmount, 10, {from: trader2}) 

            await dai.approve(dex.address, amount , {from: trader1})
            await dex.deposit(Ticker.DAI, amount, {from: trader1})
            
            const buyAmount = web3.utils.toWei("10")
            await dex.createMarketOrder(Ticker.BAT, Side.BUY, buyAmount, {from: trader1})
            
            const orders = await dex.getOrders(Ticker.BAT, Side.SELL )
            const buyerBalances = {
                DAI: await dex.traderBalances(trader1, Ticker.DAI),
                BAT: await dex.traderBalances(trader1, Ticker.BAT)
            }
            const sellerBalances = {
                DAI: await dex.traderBalances(trader2, Ticker.DAI),
                BAT: await dex.traderBalances(trader2, Ticker.BAT)
            }
            
            assert(orders.length === 1)
            assert(orders[0].filled === String(buyAmount))
            assert(buyerBalances.DAI.toString() === "0")
            assert(buyerBalances.BAT.toString() === web3.utils.toWei("10"))
            assert(sellerBalances.DAI.toString() === buyAmount + "0")
        })
        it("Creates a sell order", async () => {
            const biggerAmount = web3.utils.toWei("1000");
            await dai.approve(dex.address, biggerAmount , {from: trader2})
            await dex.deposit(Ticker.DAI, biggerAmount, {from: trader2})
           
            await dex.createLimitOrder(Ticker.BAT, Side.BUY, amount, 1, {from: trader2}) 

            await bat.approve(dex.address, amount , {from: trader1})
            await dex.deposit(Ticker.BAT, amount, {from: trader1})
            
            const sellAmount = amount
            await dex.createMarketOrder(Ticker.BAT, Side.SELL, sellAmount, {from: trader1})
            
            const orders = await dex.getOrders(Ticker.BAT, Side.BUY )
            const sellerBalances = {
                DAI: await dex.traderBalances(trader1, Ticker.DAI),
                BAT: await dex.traderBalances(trader1, Ticker.BAT)
            }
            const buyerBalances = {
                DAI: await dex.traderBalances(trader2, Ticker.DAI),
                BAT: await dex.traderBalances(trader2, Ticker.BAT)
            }
            assert(orders.length === 0)
            assert(buyerBalances.BAT.toString() === sellAmount)
            assert(buyerBalances.DAI.toString() === web3.utils.toWei("900"))
            assert(sellerBalances.DAI.toString() === sellAmount)
            assert(sellerBalances.BAT.toString() === "0"  )

        })

        it("Does NOT crate an order for non registered token", async () => {
            expectRevert(
                dex.createMarketOrder(web3.utils.fromAscii("No Token"), Side.BUY, amount),
                "Dex: Token has to be registered"
            )  
        })
        it("Does NOT crate an order for DAI", async () => {
            expectRevert(
                dex.createMarketOrder(Ticker.DAI, Side.BUY, amount),
                "Dex: Can't crate order for DAI"
            )  
        })
        it("Does NOT crate sell order for more than available balance", async () => {
            uni.approve(dex.address, amount, {from: trader1})
            dex.deposit(Ticker.UNI, amount, {from: trader1})
            
            expectRevert(
                dex.createMarketOrder(Ticker.UNI, Side.SELL, biggerAmount, {from: trader1}),
                "Dex: Not enough balance"
            )
        })
        it("Does NOT crate buy order if not enough DAI", async () => {
            await snx.approve(dex.address, amount, {from: trader2})
            await dex.deposit(Ticker.SNX, web3.utils.toWei("10"), {from: trader2})
            await dex.createLimitOrder(Ticker.SNX, Side.SELL, web3.utils.toWei("10"), "10", {from: trader2})
            
            expectRevert(
                dex.createMarketOrder(Ticker.SNX, Side.BUY, biggerAmount),
                "Dex: Not enough DAI to buy"
            )
        })


    })
})
