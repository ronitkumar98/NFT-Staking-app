
async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const RewardToken = await ethers.getContractFactory("ERC20Mock");
    const rewardToken = await RewardToken.deploy("Reward Token", "RTK", 18);
    await rewardToken.deployed();

    const NFT = await ethers.getContractFactory("ERC721Mock");
    const nft = await NFT.deploy("NFT", "NFT");
    await nft.deployed();

    const NFTStaking = await ethers.getContractFactory("NFTStaking");
    const staking = await NFTStaking.deploy(rewardToken.address, nft.address, 1, 100);
    await staking.deployed();

    console.log("RewardToken deployed to:", rewardToken.address);
    console.log("NFT deployed to:", nft.address);
    console.log("NFTStaking deployed to:", staking.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
