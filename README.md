# NFT-Staking-app
A repository showing smart contract for a NFT staking platform which includes features like staking and un-staking as desired by user and getting reward tokens based on that, UUPS pattern to upgrade the logic of the contract if necessary and administrative privileges to control certain parameter like reward token count, delay time etc


## Features

- **Staking Functionality**: Users can stake one or more NFTs to earn reward tokens per block.
- **Unstaking Functionality**: Users can unstake specific NFTs, with an unbonding period before withdrawal.
- **Reward Claiming**: Users can claim accumulated rewards after a delay period.
- **Upgradeable Contract**: Implemented using the UUPS proxy pattern for upgradeability.
- **Control Mechanisms**: Methods to pause and unpause the staking process, update reward tokens per block, and upgrade staking configuration.
