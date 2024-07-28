# NFT Staking Contract

This repository contains a smart contract for staking NFTs to earn ERC20 token rewards. The contract includes features for staking, unstaking, reward claiming, and administrative control using the UUPS upgradeable proxy pattern.

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js and npm installed
- Hardhat installed globally (`npm install --global hardhat`)
- A code editor such as VSCode
- OpenZeppelin libraries installed (`npm install @openzeppelin/contracts-upgradeable`)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/nft-staking.git
    cd nft-staking
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

## Configuration

1. Create a `.env` file in the root directory and configure your environment variables (if needed). Example:
    ```bash
    INFURA_PROJECT_ID=your-infura-project-id
    PRIVATE_KEY=your-private-key
    ```

2. Update `hardhat.config.js` if you want to deploy to a network other than the default Hardhat network.

## Deployment

1. Compile the contracts:
    ```bash
    npx hardhat compile
    ```

2. Deploy the contracts:
    ```bash
    npx hardhat run scripts/deploy.js --network your-network
    ```

## Testing

1. Run the tests:
    ```bash
    npx hardhat test
    ```

## Interacting with the Contract

You can interact with the contract using Hardhat tasks, scripts, or a frontend interface. Below are some examples:

### Hardhat Console

1. Open the Hardhat console:
    ```bash
    npx hardhat console --network your-network
    ```

2. Interact with the deployed contract:
    ```javascript
    const nftStaking = await ethers.getContract("NFTStaking");
    const [owner, addr1] = await ethers.getSigners();

    // Stake an NFT
    await nftStaking.connect(addr1).stake(1);

    // Unstake an NFT
    await nftStaking.connect(addr1).unstake(1);

    // Claim rewards
    await nftStaking.connect(addr1).claimRewards();
    ```

## Contract Overview

### `NFTStaking` Contract

The `NFTStaking` contract allows users to stake their NFTs and earn ERC20 token rewards. The contract includes the following features:

1. **Staking Functionality**:
    - Users can stake one or multiple NFTs.
    - For each staked NFT, the user receives reward tokens per block.

2. **Unstaking Functionality**:
    - Users can unstake NFTs.
    - Users can choose which specific NFTs to unstake.
    - After unstaking, there is an unbonding period after which the user can withdraw the NFT.
    - No additional rewards are given after the unbonding period for the unstaked NFTs.

3. **Reward Claiming**:
    - Users can claim their accumulated rewards after a delay period.
    - Once rewards are claimed, the delay period resets.

4. **Upgradeable Contract**:
    - Implement the UUPS (Universal Upgradeable Proxy Standard) proxy pattern for upgradeability.

5. **Control Mechanisms**:
    - Methods to pause and unpause the staking process.
    - Ability to update the number of reward tokens given per block.
    - Ability to upgrade the staking configuration.

### Contract Functions

- `stake(uint256 tokenId)`: Stakes the specified NFT.
- `unstake(uint256 tokenId)`: Unstakes the specified NFT.
- `withdraw(uint256 tokenId)`: Withdraws the specified NFT after the unbonding period.
- `claimRewards()`: Claims the accumulated rewards.
- `setRewardRate(uint256 newRewardRate)`: Sets a new reward rate.
- `setUnbondingPeriod(uint256 newUnbondingPeriod)`: Sets a new unbonding period.
- `setRewardDelay(uint256 newRewardDelay)`: Sets a new reward delay.
- `pauseStaking()`: Pauses the staking process.
- `unpauseStaking()`: Unpauses the staking process.

## License

This project is licensed under the MIT License.

## Contact

If you have any questions, feel free to contact me at [ronitkumar9874@gmail.com].
