// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

// ignition/modules/EngancheToken.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";



const EngancheTokenModule = buildModule("EngancheTokenModule", (m) => {
  const name = "EngancheToken";
  const symbol = "ENGT";
  const decimals = 18;
  const totalSupply = "10000000000000000000000000";

  const engancheToken = m.contract("EngancheToken", [name, symbol, decimals, totalSupply]);

  return { engancheToken };
});

export default EngancheTokenModule;

