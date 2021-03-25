const {time} = require("@openzeppelin/test-helpers")

const Dai = artifacts.require("mocks/Dai");
const Bat = artifacts.require("mocks/Bat");
const Snx = artifacts.require("mocks/Snx");
const Uni = artifacts.require("mocks/Uni");
const Dex = artifacts.require("Dex");


const [UNI, BAT, SNX, DAI] = ["UNI", "BAT", "SNX", "DAI"].map(web3.utils.fromAscii)

const prepareShowcase = async function ({dai, bat, snx, uni, dex, accounts}) {

    const SIDE = {
        BUY: 0,
        SELL: 1
    }

    const [trader1, trader2, trader3, trader4, _] = accounts 
    
    const amount = web3.utils.toWei("1000")


    const traders = [trader1, trader2, trader3, trader4]
    traders.forEach( async (trader) => {
        await Promise.all(
            [dai, bat, snx, uni].map( coin => 
                coin.faucet(amount, trader)
            )
        )

        await Promise.all(
             [dai, bat, snx, uni].map( coin =>
                 coin.approve(
                     dex.address,
                     amount,
                     {from: trader}
                 )
             )
        )

        await Promise.all(
            [DAI, BAT, SNX, UNI].map( ticker =>
                dex.deposit(
                    amount,
                    ticker
                )
            )
        )

    })
}

const seedOrdersAndTrades =  async function ({dai, bat, snx, uni, dex, accounts}) {
    //create trades
      await dex.createLimitOrder(BAT, SIDE.BUY, 1321, 10, {from: trader1});
      await dex.createMarketOrder(BAT,  SIDE.SELL, 1321, {from: trader2});
      await time.increase(1);
      await dex.createLimitOrder(BAT,SIDE.BUY,  1242, 11, {from: trader1});
      await dex.createMarketOrder(BAT,SIDE.SELL,  1242, {from: trader2});
      await time.increase(1);
      await dex.createLimitOrder(BAT,SIDE.BUY,  900, 15, {from: trader1});
      await dex.createMarketOrder(BAT,SIDE.SELL, 900, {from: trader2});
      await time.increase(1);
      await dex.createLimitOrder(BAT,SIDE.BUY,  1555, 14, {from: trader1});
      await dex.createMarketOrder(BAT,SIDE.SELL,  1555, {from: trader2});
      await time.increase(1);
      await dex.createLimitOrder(BAT,SIDE.BUY,  2011, 12, {from: trader1});
      await dex.createMarketOrder(BAT,SIDE.SELL,  2011, {from: trader2});

      await dex.createLimitOrder(UNI,SIDE.BUY,  999, 2, {from: trader1});
      await dex.createMarketOrder(UNI,SIDE.SELL,  999, {from: trader2});
      await time.increase(1);
      await dex.createLimitOrder(UNI,SIDE.BUY,  523, 4, {from: trader1});
      await dex.createMarketOrder(UNI,SIDE.SELL,  523, {from: trader2});
      await time.increase(1);
      await dex.createLimitOrder(UNI,SIDE.BUY,  811, 2, {from: trader1});
      await dex.createMarketOrder(UNI,SIDE.SELL,  811, {from: trader2});
      await time.increase(1);
      await dex.createLimitOrder(UNI,SIDE.BUY,  1398, 6, {from: trader1});
      await dex.createMarketOrder(UNI, 1398, {from: trader2});

    await Promise.all([
        dex.createLimitOrder(UNI, 1400, 10, SIDE.BUY, {from: trader1}),
        dex.createLimitOrder(UNI, 1200, 11, SIDE.BUY, {from: trader2}),
        dex.createLimitOrder(UNI, 1000, 12, SIDE.BUY, {from: trader2}),

        dex.createLimitOrder(BAT, 3000, 4, SIDE.BUY, {from: trader1}),
        dex.createLimitOrder(BAT, 2000, 5, SIDE.BUY, {from: trader1}),
        dex.createLimitOrder(BAT, 500, 6, SIDE.BUY, {from: trader2}),

        dex.createLimitOrder(SNX, 4000, 12, SIDE.BUY, {from: trader1}),
        dex.createLimitOrder(SNX, 3000, 13, SIDE.BUY, {from: trader1}),
        dex.createLimitOrder(SNX, 500, 14, SIDE.BUY, {from: trader2}),

        dex.createLimitOrder(SNX, 2000, 16, SIDE.SELL, {from: trader3}),
        dex.createLimitOrder(SNX, 3000, 15, SIDE.SELL, {from: trader4}),
        dex.createLimitOrder(SNX, 500, 14, SIDE.SELL, {from: trader4}),

        dex.createLimitOrder(UNI, 4000, 10, SIDE.SELL, {from: trader3}),
        dex.createLimitOrder(UNI, 2000, 9, SIDE.SELL, {from: trader3}),
        dex.createLimitOrder(UNI, 800, 8, SIDE.SELL, {from: trader4}),

        dex.createLimitOrder(BAT, 1500, 23, SIDE.SELL, {from: trader3}),
        dex.createLimitOrder(BAT, 1200, 22, SIDE.SELL, {from: trader3}),
        dex.createLimitOrder(BAT, 900, 21, SIDE.SELL, {from: trader4}),
    ]);
}


const createShowcase  =  async function ({dai, bat, snx, uni, dex, accounts}) {
    await fundShowcase()
    await seedOrdersAndTrades()
}
module.exports = async function (deployer, _network, accounts) {
    
    await Promise.all([
         deployer.deploy(Dai),
         deployer.deploy(Bat),
         deployer.deploy(Snx),
         deployer.deploy(Uni),
         deployer.deploy(Dex)
    ])

    const [dai, bat, snx, uni, dex] = await Promise.all(
        [Dai, Bat, Snx, Uni, Dex].map(contract => contract.deployed())
    )
    
    // register 
    await Promise.all([
        dex.addToken(DAI, dai.address),
        dex.addToken(BAT, bat.address),
        dex.addToken(SNX, snx.address),
        dex.addToken(UNI, uni.address),
    ]) 

    await prepareShowcase({dai, bat, snx, uni, dex, accounts})

};
