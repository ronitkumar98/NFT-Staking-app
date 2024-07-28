const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("NFTStaking", function () {
    let NFTStaking, nftStaking, MockERC721, mockERC721, RewardToken, rewardToken, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        // Deploy MockERC721 contract
        MockERC721 = await ethers.getContractFactory("MockERC721");
        mockERC721 = await upgrades.deployProxy(MockERC721);
        await mockERC721.deployed();

        // Deploy ERC20 reward token
        RewardToken = await ethers.getContractFactory("ERC20Upgradeable");
        rewardToken = await upgrades.deployProxy(RewardToken, ["RewardToken", "RTKN", 18]);
        await rewardToken.deployed();

        // Mint some ERC20 tokens to the owner for rewards
        await rewardToken.mint(owner.address, ethers.utils.parseEther("1000"));

        // Deploy NFTStaking contract
        NFTStaking = await ethers.getContractFactory("NFT_staking");
        nftStaking = await upgrades.deployProxy(NFTStaking, [
            mockERC721.address,
            rewardToken.address,
            ethers.utils.parseEther("1"), // reward rate
            100, // unbonding period
            50, // reward delay
        ]);
        await nftStaking.deployed();

        // Mint some NFTs to addr1
        await mockERC721.mint(addr1.address, 1);
        await mockERC721.mint(addr1.address, 2);
    });

    it("should allow staking and unstaking of NFTs", async function () {
        // Approve NFTStaking contract to transfer addr1's NFTs
        await mockERC721.connect(addr1).approve(nftStaking.address, 1);
        await mockERC721.connect(addr1).approve(nftStaking.address, 2);

        // Stake NFT 1
        await nftStaking.connect(addr1).stake(1);

        // Check that the NFT is transferred to the contract
        expect(await mockERC721.ownerOf(1)).to.equal(nftStaking.address);

        // Unstake NFT 1
        await nftStaking.connect(addr1).unstake(1);

        // Wait for unbonding period to end
        await ethers.provider.send("evm_increaseTime", [100]);
        await ethers.provider.send("evm_mine");

        // Withdraw NFT 1
        await nftStaking.connect(addr1).withdraw(1);

        // Check that the NFT is transferred back to addr1
        expect(await mockERC721.ownerOf(1)).to.equal(addr1.address);
    });

    it("should allow claiming of rewards", async function () {
        // Approve NFTStaking contract to transfer addr1's NFTs
        await mockERC721.connect(addr1).approve(nftStaking.address, 1);

        // Stake NFT 1
        await nftStaking.connect(addr1).stake(1);

        // Wait for some blocks to pass
        await ethers.provider.send("evm_mine");

        // Claim rewards
        await nftStaking.connect(addr1).claimRewards();

        // Check that the rewards are transferred
        const rewards = await rewardToken.balanceOf(addr1.address);
        expect(rewards).to.be.gt(0);
    });

    it("should prevent unstaking before unbonding period", async function () {
        // Approve NFTStaking contract to transfer addr1's NFTs
        await mockERC721.connect(addr1).approve(nftStaking.address, 1);

        // Stake NFT 1
        await nftStaking.connect(addr1).stake(1);

        // Unstake NFT 1
        await nftStaking.connect(addr1).unstake(1);

        // Attempt to withdraw NFT 1 before unbonding period ends
        await expect(nftStaking.connect(addr1).withdraw(1)).to.be.revertedWith("Token not found or unbonding period not ended");

        // Wait for unbonding period to end
        await ethers.provider.send("evm_increaseTime", [100]);
        await ethers.provider.send("evm_mine");

        // Withdraw NFT 1
        await nftStaking.connect(addr1).withdraw(1);

        // Check that the NFT is transferred back to addr1
        expect(await mockERC721.ownerOf(1)).to.equal(addr1.address);
    });

    it("should prevent staking when paused", async function () {
        // Pause the contract
        await nftStaking.connect(owner).pause();

        // Attempt to stake an NFT
        await mockERC721.connect(addr1).approve(nftStaking.address, 1);
        await expect(nftStaking.connect(addr1).stake(1)).to.be.revertedWith("Pausable: paused");
    });

    it("should allow staking when unpaused", async function () {
        // Pause and then unpause the contract
        await nftStaking.connect(owner).pause();
        await nftStaking.connect(owner).unpause();

        // Approve NFTStaking contract to transfer addr1's NFTs
        await mockERC721.connect(addr1).approve(nftStaking.address, 1);

        // Stake NFT 1
        await nftStaking.connect(addr1).stake(1);

        // Check that the NFT is transferred to the contract
        expect(await mockERC721.ownerOf(1)).to.equal(nftStaking.address);
    });

    it("should allow the owner to set new reward rate", async function () {
        // Set new reward rate
        const newRewardRate = ethers.utils.parseEther("2");
        await nftStaking.connect(owner).setRewardRate(newRewardRate);

        // Check that the reward rate is updated
        expect(await nftStaking.rewardRate()).to.equal(newRewardRate);
    });

    it("should allow the owner to set new unbonding period", async function () {
        // Set new unbonding period
        const newUnbondingPeriod = 200;
        await nftStaking.connect(owner).setUnbondingPeriod(newUnbondingPeriod);

        // Check that the unbonding period is updated
        expect(await nftStaking.unbondingPeriod()).to.equal(newUnbondingPeriod);
    });

    it("should allow the owner to set new reward delay", async function () {
        // Set new reward delay
        const newRewardDelay = 100;
        await nftStaking.connect(owner).setRewardDelay(newRewardDelay);

        // Check that the reward delay is updated
        expect(await nftStaking.rewardDelay()).to.equal(newRewardDelay);
    });
});
