import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
// import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { should } from "chai";
should();
import hre from "hardhat";

describe("Staff Salary", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function StaffSalaryFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, addr1] = await hre.ethers.getSigners();
    console.log(typeof owner);
    

    const StaffSalaryManager = await hre.ethers.getContractFactory(
      "StaffSalaryManager"
    );
    const staffSalary = await StaffSalaryManager.deploy();

    return { staffSalary, owner, addr1 };
  }

  describe("Deployment", function () {
    it("It should set the owner as the deployer", async function () {
      const { owner } = await loadFixture(StaffSalaryFixture);
      const ownerAddress = await owner.getAddress();
      owner.should.equal(ownerAddress);
    });

    
  });
});
