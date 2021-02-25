//SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
import "@openzeppelin/contracts/ERC20.sol";

contract Dai is ERC20 {
    constructor() ERC20("Fake Dai", "DAI") public {}
    
    function faucet(uint amount, address to) public {
        _mint(to, amount);
    }
}
