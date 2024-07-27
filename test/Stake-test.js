const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTStaking", function () {
  let owner, addr1, addr2;
  let rewardToken, nft, nftStaking;
  const rewardRate = 10; // Example reward rate
  const unbondingPeriod = 100; // Example unbonding period

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy ERC20 token
    const ERC20 = await ethers.getContractFactory("ERC20Token");
    rewardToken = await ERC20.deploy("RewardToken", "RTK", ethers.utils.parseEther("1000000"));
    await rewardToken.deployed();

    // Deploy ERC721 token
    const ERC721 = await ethers.getContractFactory("ERC721Token");
    nft = await ERC721.deploy("NFTToken", "NFT");
    await nft.deployed();

    // Deploy NFTStaking contract
    const NFTStaking = await ethers.getContractFactory("NFTStaking");
    nftStaking = await NFTStaking.deploy(rewardToken.address, nft.address, rewardRate, unbondingPeriod);
    await nftStaking.deployed();

    // Mint some NFTs to addr1
    await nft.connect(addr1).mint(1);
    await nft.connect(addr1).mint(2);
    await nft.connect(addr1).mint(3);

    // Mint some reward tokens to NFTStaking contract
    await rewardToken.transfer(nftStaking.address, ethers.utils.parseEther("10000"));
  });

  describe("Staking", function () {
    it("Should allow users to stake NFTs", async function () {
      await nft.connect(addr1).approve(nftStaking.address, 1);
      await nftStaking.connect(addr1).stake(1);

      const stakes = await nftStaking.stakes(addr1.address);
      expect(stakes.length).to.equal(1);
      expect(stakes[0].tokenId).to.equal(1);
    });

    it("Should calculate rewards correctly", async function () {
      await nft.connect(addr1).approve(nftStaking.address, 1);
      await nftStaking.connect(addr1).stake(1);

      // Simulate blocks
      await ethers.provider.send("evm_mine", [ethers.provider.getBlockNumber() + 100]);

      const rewards = await nftStaking.calculateRewards(addr1.address);
      expect(rewards).to.equal(100 * rewardRate);
    });

    it("Should not allow staking when paused", async function () {
      await nftStaking.connect(owner).pause();
      await nft.connect(addr1).approve(nftStaking.address, 1);
      await expect(nftStaking.connect(addr1).stake(1)).to.be.revertedWith("Staking is paused");
    });
  });

  describe("Unstaking", function () {
    it("Should allow users to unstake NFTs", async function () {
      await nft.connect(addr1).approve(nftStaking.address, 1);
      await nftStaking.connect(addr1).stake(1);

      await nftStaking.connect(addr1).unstake(1);

      const stakes = await nftStaking.stakes(addr1.address);
      expect(stakes[0].unstaking).to.be.true;
    });

    it("Should not allow unstaking non-staked NFTs", async function () {
      await expect(nftStaking.connect(addr1).unstake(1)).to.be.revertedWith("NFT is not staked or already unstaking");
    });

    it("Should handle multiple unstaking correctly", async function () {
      await nft.connect(addr1).approve(nftStaking.address, 1);
      await nft.connect(addr1).approve(nftStaking.address, 2);
      await nftStaking.connect(addr1).stake(1);
      await nftStaking.connect(addr1).stake(2);

      await nftStaking.connect(addr1).unstake(1);
      await nftStaking.connect(addr1).unstake(2);

      const stakes = await nftStaking.stakes(addr1.address);
      expect(stakes[0].unstaking).to.be.true;
      expect(stakes[1].unstaking).to.be.true;
    });

    it("Should calculate rewards correctly when unstaking", async function () {
      await nft.connect(addr1).approve(nftStaking.address, 1);
      await nftStaking.connect(addr1).stake(1);

      // Simulate blocks
      await ethers.provider.send("evm_mine", [ethers.provider.getBlockNumber() + 50]);

      await nftStaking.connect(addr1).unstake(1);

      const rewards = await nftStaking.rewards(addr1.address);
      expect(rewards).to.equal(50 * rewardRate);
    });

    it("Should not allow withdrawal before unbonding period", async function () {
      await nft.connect(addr1).approve(nftStaking.address, 1);
      await nftStaking.connect(addr1).stake(1);

      await nftStaking.connect(addr1).unstake(1);

      await expect(nftStaking.connect(addr1).withdraw(1)).to.be.revertedWith("Unbonding period not yet over");
    });

    it("Should allow withdrawal after unbonding period", async function () {
      await nft.connect(addr1).approve(nftStaking.address, 1);
      await nftStaking.connect(addr1).stake(1);

      await nftStaking.connect(addr1).unstake(1);

      // Simulate blocks
      await ethers.provider.send("evm_mine", [ethers.provider.getBlockNumber() + unbondingPeriod]);

      await nftStaking.connect(addr1).withdraw(1);

      expect(await nft.ownerOf(1)).to.equal(addr1.address);
    });
  });

  describe("Rewards", function () {
    it("Should allow users to claim rewards", async function () {
      await nft.connect(addr1).approve(nftStaking.address, 1);
      await nftStaking.connect(addr1).stake(1);

      // Simulate blocks
      await ethers.provider.send("evm_mine", [ethers.provider.getBlockNumber() + 100]);

      await nftStaking.connect(addr1).claimRewards();

      const rewardBalance = await rewardToken.balanceOf(addr1.address);
      expect(rewardBalance).to.equal(100 * rewardRate);
    });

    it("Should reset rewards after claiming", async function () {
      await nft.connect(addr1).approve(nftStaking.address, 1);
      await nftStaking.connect(addr1).stake(1);

      // Simulate blocks
      await ethers.provider.send("evm_mine", [ethers.provider.getBlockNumber() + 100]);

      await nftStaking.connect(addr1).claimRewards();

      const rewards = await nftStaking.rewards(addr1.address);
      expect(rewards).to.equal(0);
    });

    it("Should not allow claiming rewards when paused", async function () {
      await nft.connect(addr1).approve(nftStaking.address, 1);
      await nftStaking.connect(addr1).stake(1);

      // Simulate blocks
      await ethers.provider.send("evm_mine", [ethers.provider.getBlockNumber() + 100]);

      await nftStaking.connect(owner).pause();
      await expect(nftStaking.connect(addr1).claimRewards()).to.be.revertedWith("Staking is paused");
    });
  });

  describe("Owner functions", function () {
    it("Should allow owner to set reward rate", async function () {
      await nftStaking.connect(owner).setRewardRate(20);
      expect(await nftStaking.rewardRate()).to.equal(20);
    });

    it("Should allow owner to pause and unpause staking", async function () {
      await nftStaking.connect(owner).pause();
      expect(await nftStaking.paused()).to.be.true;

      await nftStaking.connect(owner).unpause();
      expect(await nftStaking.paused()).to.be.false;
    });

    it("Should not allow non-owner to set reward rate", async function () {
      await expect(nftStaking.connect(addr1).setRewardRate(20)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow non-owner to pause or unpause staking", async function () {
      await expect(nftStaking.connect(addr1).pause()).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(nftStaking.connect(addr1).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
