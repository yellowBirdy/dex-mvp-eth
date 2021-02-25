//SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
import "@openzeppelin/contracts/ERC20.sol";

contract Snx is ERC20 {
    constructor() ERC20("Synthetix Token", "SNX") public {}
    
        function faucet(uint amount, address to) public {
        _mint(to, amount);
    }
}
