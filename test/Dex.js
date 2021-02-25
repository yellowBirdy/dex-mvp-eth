const Dex = artifacts.require("Dex.sol");
const Dai = artifacts.require("mocks/Dai.sol");
const Bat = artifacts.require("mocks/Bat.sol");
const Snx = artifacts.require("mocks/Snx.sol");
const Uni = artifacts.require("mocks/Uni.sol");


contract("Dex", (accounts) => (
    let dex, dai, bat, snx, uni
    beforeEach(async () => {
        [dai, bat, snx, uni] = await Proise.all([
            Dai.new(),
            Bat.new(),
            Snx.new(),
            Uni.new()
        ])
        dex = await Dex.new();
    });
})
