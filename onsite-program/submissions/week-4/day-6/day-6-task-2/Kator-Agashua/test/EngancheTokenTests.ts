import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("EngancheToken", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployEngancheToken() {
    // Test constants
    const TOKEN_NAME = "Enganche Token";
    const TOKEN_SYMBOL = "ENG";
    const TOKEN_DECIMALS = 18;
    const TOTAL_SUPPLY = hre.ethers.parseEther("1000000"); // 1 million tokens

    // Contracts are deployed using the first signer/account by default
    const [owner, addr1, addr2] = await hre.ethers.getSigners();

    const EngancheToken = await hre.ethers.getContractFactory("EngancheToken");
    const engancheToken = await EngancheToken.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL, 
      TOKEN_DECIMALS,
      TOTAL_SUPPLY
    );

    return { 
      engancheToken, 
      owner, 
      addr1, 
      addr2,
      TOKEN_NAME,
      TOKEN_SYMBOL,
      TOKEN_DECIMALS,
      TOTAL_SUPPLY
    };
  }

  describe("Deployment", function () {
    it("Should set the right name", async function () {
      const { engancheToken, TOKEN_NAME } = await loadFixture(deployEngancheToken);

      expect(await engancheToken.name()).to.equal(TOKEN_NAME);
    });

    it("Should set the right symbol", async function () {
      const { engancheToken, TOKEN_SYMBOL } = await loadFixture(deployEngancheToken);

      expect(await engancheToken.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should set the right decimals", async function () {
      const { engancheToken, TOKEN_DECIMALS } = await loadFixture(deployEngancheToken);

      expect(await engancheToken.decimals()).to.equal(TOKEN_DECIMALS);
    });

    it("Should set the right total supply", async function () {
      const { engancheToken, TOTAL_SUPPLY } = await loadFixture(deployEngancheToken);

      expect(await engancheToken.totalSupply()).to.equal(TOTAL_SUPPLY);
    });

    it("Should assign the total supply to the owner", async function () {
      const { engancheToken, owner, TOTAL_SUPPLY } = await loadFixture(deployEngancheToken);

      const ownerBalance = await engancheToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(TOTAL_SUPPLY);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const { engancheToken, owner, addr1, TOTAL_SUPPLY } = await loadFixture(deployEngancheToken);
      const transferAmount = hre.ethers.parseEther("50");

      // Transfer from owner to addr1
      await engancheToken.transfer(addr1.address, transferAmount);
      const addr1Balance = await engancheToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);

      // Check owner balance decreased
      const ownerBalance = await engancheToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(TOTAL_SUPPLY - transferAmount);
    });

    it("Should emit Transfer event", async function () {
      const { engancheToken, owner, addr1 } = await loadFixture(deployEngancheToken);
      const transferAmount = hre.ethers.parseEther("50");

      await expect(engancheToken.transfer(addr1.address, transferAmount))
        .to.emit(engancheToken, "Transfer")
        .withArgs(owner.address, addr1.address, transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { engancheToken, owner, addr1, TOTAL_SUPPLY } = await loadFixture(deployEngancheToken);
      const transferAmount = TOTAL_SUPPLY + 1n;

      await expect(
        engancheToken.transfer(addr1.address, transferAmount)
      ).to.be.revertedWith("Insufficient tokens!");
    });

    it("Should fail when transferring to the token contract itself", async function () {
      const { engancheToken } = await loadFixture(deployEngancheToken);
      const transferAmount = hre.ethers.parseEther("50");

      await expect(
        engancheToken.transfer(engancheToken.target, transferAmount)
      ).to.be.revertedWith("Cannot transfer to token contract itself");
    });

    it("Should handle zero amount transfers", async function () {
      const { engancheToken, owner, addr1 } = await loadFixture(deployEngancheToken);

      await expect(engancheToken.transfer(addr1.address, 0))
        .to.emit(engancheToken, "Transfer")
        .withArgs(owner.address, addr1.address, 0);

      const addr1Balance = await engancheToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(0);
    });
  });

  describe("Allowances", function () {
    it("Should approve tokens for delegated transfer", async function () {
      const { engancheToken, owner, addr1 } = await loadFixture(deployEngancheToken);
      const approvalAmount = hre.ethers.parseEther("100");

      await engancheToken.approve(addr1.address, approvalAmount);
      const allowance = await engancheToken.allowance(owner.address, addr1.address);
      expect(allowance).to.equal(approvalAmount);
    });

    it("Should emit Approval event", async function () {
      const { engancheToken, owner, addr1 } = await loadFixture(deployEngancheToken);
      const approvalAmount = hre.ethers.parseEther("100");

      await expect(engancheToken.approve(addr1.address, approvalAmount))
        .to.emit(engancheToken, "Approval")
        .withArgs(owner.address, addr1.address, approvalAmount);
    });

    it("Should allow updating approval amount", async function () {
      const { engancheToken, owner, addr1 } = await loadFixture(deployEngancheToken);
      const firstApproval = hre.ethers.parseEther("100");
      const secondApproval = hre.ethers.parseEther("200");

      // First approval
      await engancheToken.approve(addr1.address, firstApproval);
      expect(await engancheToken.allowance(owner.address, addr1.address)).to.equal(firstApproval);

      // Update approval
      await engancheToken.approve(addr1.address, secondApproval);
      expect(await engancheToken.allowance(owner.address, addr1.address)).to.equal(secondApproval);
    });

    it("Should allow setting approval to zero", async function () {
      const { engancheToken, owner, addr1 } = await loadFixture(deployEngancheToken);
      const approvalAmount = hre.ethers.parseEther("100");

      // Set approval
      await engancheToken.approve(addr1.address, approvalAmount);
      expect(await engancheToken.allowance(owner.address, addr1.address)).to.equal(approvalAmount);

      // Reset to zero
      await engancheToken.approve(addr1.address, 0);
      expect(await engancheToken.allowance(owner.address, addr1.address)).to.equal(0);
    });
  });

  describe("TransferFrom", function () {
    it("Should transfer tokens using transferFrom", async function () {
      const { engancheToken, owner, addr1, addr2, TOTAL_SUPPLY } = await loadFixture(deployEngancheToken);
      const approvalAmount = hre.ethers.parseEther("100");
      const transferAmount = hre.ethers.parseEther("50");

      // Setup: Owner approves addr1 to spend tokens
      await engancheToken.approve(addr1.address, approvalAmount);

      // addr1 transfers from owner to addr2
      await engancheToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

      const addr2Balance = await engancheToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(transferAmount);

      const ownerBalance = await engancheToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(TOTAL_SUPPLY - transferAmount);
    });

    it("Should reduce allowance after transferFrom", async function () {
      const { engancheToken, owner, addr1, addr2 } = await loadFixture(deployEngancheToken);
      const approvalAmount = hre.ethers.parseEther("100");
      const transferAmount = hre.ethers.parseEther("50");

      await engancheToken.approve(addr1.address, approvalAmount);
      await engancheToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

      const newAllowance = await engancheToken.allowance(owner.address, addr1.address);
      expect(newAllowance).to.equal(approvalAmount - transferAmount);
    });

    it("Should emit Transfer event on transferFrom", async function () {
      const { engancheToken, owner, addr1, addr2 } = await loadFixture(deployEngancheToken);
      const approvalAmount = hre.ethers.parseEther("100");
      const transferAmount = hre.ethers.parseEther("50");

      await engancheToken.approve(addr1.address, approvalAmount);

      await expect(
        engancheToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
      )
        .to.emit(engancheToken, "Transfer")
        .withArgs(owner.address, addr2.address, transferAmount);
    });

    it("Should fail if allowance is insufficient", async function () {
      const { engancheToken, owner, addr1, addr2 } = await loadFixture(deployEngancheToken);
      const approvalAmount = hre.ethers.parseEther("100");
      const transferAmount = hre.ethers.parseEther("150"); // More than approved

      await engancheToken.approve(addr1.address, approvalAmount);

      await expect(
        engancheToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
      ).to.be.revertedWith("Not allowed to spend this much!");
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { engancheToken, owner, addr1, addr2, TOTAL_SUPPLY } = await loadFixture(deployEngancheToken);
      const approvalAmount = hre.ethers.parseEther("100");
      const transferAmount = hre.ethers.parseEther("50");

      // First, transfer most tokens away from owner
      const mostTokens = TOTAL_SUPPLY - hre.ethers.parseEther("10");
      await engancheToken.transfer(addr2.address, mostTokens);

      // Approve and try to transferFrom more than owner has
      await engancheToken.approve(addr1.address, approvalAmount);
      await expect(
        engancheToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
      ).to.be.revertedWith("Sender doesn't have enough tokens!");
    });

    it("Should fail when transferring to the token contract itself via transferFrom", async function () {
      const { engancheToken, owner, addr1 } = await loadFixture(deployEngancheToken);
      const approvalAmount = hre.ethers.parseEther("100");
      const transferAmount = hre.ethers.parseEther("50");

      await engancheToken.approve(addr1.address, approvalAmount);

      await expect(
        engancheToken.connect(addr1).transferFrom(owner.address, engancheToken.target, transferAmount)
      ).to.be.revertedWith("Cannot transfer to token contract itself");
    });

    it("Should handle exact allowance amount", async function () {
      const { engancheToken, owner, addr1, addr2 } = await loadFixture(deployEngancheToken);
      const exactAmount = hre.ethers.parseEther("100");

      await engancheToken.approve(addr1.address, exactAmount);
      await engancheToken.connect(addr1).transferFrom(owner.address, addr2.address, exactAmount);

      const newAllowance = await engancheToken.allowance(owner.address, addr1.address);
      expect(newAllowance).to.equal(0);

      const addr2Balance = await engancheToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(exactAmount);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple transfers correctly", async function () {
      const { engancheToken, owner, addr1, addr2 } = await loadFixture(deployEngancheToken);
      const transfer1 = hre.ethers.parseEther("100");
      const transfer2 = hre.ethers.parseEther("200");
      const transfer3 = hre.ethers.parseEther("50");

      await engancheToken.transfer(addr1.address, transfer1);
      await engancheToken.transfer(addr2.address, transfer2);
      await engancheToken.connect(addr1).transfer(addr2.address, transfer3);

      expect(await engancheToken.balanceOf(addr1.address)).to.equal(transfer1 - transfer3);
      expect(await engancheToken.balanceOf(addr2.address)).to.equal(transfer2 + transfer3);
    });

    it("Should maintain total supply conservation", async function () {
      const { engancheToken, owner, addr1, addr2, TOTAL_SUPPLY } = await loadFixture(deployEngancheToken);

      // Perform various transfers
      await engancheToken.transfer(addr1.address, hre.ethers.parseEther("300"));
      await engancheToken.transfer(addr2.address, hre.ethers.parseEther("200"));
      await engancheToken.connect(addr1).transfer(addr2.address, hre.ethers.parseEther("100"));

      // Check that total supply is conserved
      const ownerBalance = await engancheToken.balanceOf(owner.address);
      const addr1Balance = await engancheToken.balanceOf(addr1.address);
      const addr2Balance = await engancheToken.balanceOf(addr2.address);

      expect(ownerBalance + addr1Balance + addr2Balance).to.equal(TOTAL_SUPPLY);
    });
  });

  describe("View Functions", function () {
    it("Should return correct balance for any address", async function () {
      const { engancheToken, owner, addr1, addr2, TOTAL_SUPPLY } = await loadFixture(deployEngancheToken);

      expect(await engancheToken.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY);
      expect(await engancheToken.balanceOf(addr1.address)).to.equal(0);
      expect(await engancheToken.balanceOf(addr2.address)).to.equal(0);
    });

    it("Should return correct allowance for any owner-spender pair", async function () {
      const { engancheToken, owner, addr1 } = await loadFixture(deployEngancheToken);

      expect(await engancheToken.allowance(owner.address, addr1.address)).to.equal(0);
      
      const approvalAmount = hre.ethers.parseEther("50");
      await engancheToken.approve(addr1.address, approvalAmount);
      
      expect(await engancheToken.allowance(owner.address, addr1.address)).to.equal(approvalAmount);
    });
  });
});