// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract NFTStaking is Initializable, UUPSUpgradeable, OwnableUpgradeable,PausableUpgradeable{
    ERC721Upgradeable public nft;
    ERC20Upgradeable public rewardToken;
    bool pauses;
    uint256 public rewardRate;
    uint256 public unbondingPeriod;
    uint256 public rewardDelay;

    struct Stake {
        address owner;
        uint256 tokenId;
        uint256 startBlock;
        uint256 endBlock;
    }

    mapping(address => Stake[]) public stakes;
    mapping(address => uint256) public lastClaimedBlock;

    event Staked(address indexed user, uint256 tokenId, uint256 startBlock);
    event Unstaked(address indexed user, uint256 tokenId, uint256 endBlock);
    event RewardsClaimed(address indexed user, uint256 amount);

    function initialize(
        address _nft,
        address _rewardToken,
        uint256 _rewardRate,
        uint256 _unbondingPeriod,
        uint256 _rewardDelay
    ) public initializer {
        __Ownable_init(msg.sender);
        __Pausable_init();
        __UUPSUpgradeable_init();
        nft = ERC721Upgradeable(_nft);
        rewardToken = ERC20Upgradeable(_rewardToken);
        rewardRate = _rewardRate;
        unbondingPeriod = _unbondingPeriod;
        rewardDelay = _rewardDelay;
    }

    function pause()external  onlyOwner{
        pauses =true;
    }
    function unpause() external  onlyOwner{
        pauses =false;
    }


    function stake(uint256 tokenId) external whenNotPaused {
        nft.transferFrom(msg.sender, address(this), tokenId);
        stakes[msg.sender].push(Stake(msg.sender, tokenId, block.number, 0));
        emit Staked(msg.sender, tokenId, block.number);
    }

    function unstake(uint256 tokenId) external whenNotPaused {
        Stake[] storage userStakes = stakes[msg.sender];
        for (uint256 i = 0; i < userStakes.length; i++) {
            if (userStakes[i].tokenId == tokenId && userStakes[i].endBlock == 0) {
                userStakes[i].endBlock = block.number + unbondingPeriod;
                emit Unstaked(msg.sender, tokenId, userStakes[i].endBlock);
                return;
            }
        }
        revert("Token not found or already unstaked");
    }

    function withdraw(uint256 tokenId) external {
        Stake[] storage userStakes = stakes[msg.sender];
        for (uint256 i = 0; i < userStakes.length; i++) {
            if (userStakes[i].tokenId == tokenId && userStakes[i].endBlock > 0 && block.number >= userStakes[i].endBlock) {
                nft.transferFrom(address(this), msg.sender, tokenId);
                userStakes[i] = userStakes[userStakes.length - 1];
                userStakes.pop();
                return;
            }
        }
        revert("Token not found or unbonding period not ended");
    }

    function claimRewards() external {
        uint256 rewards = calculateRewards(msg.sender);
        require(rewardToken.transfer(msg.sender, rewards), "Reward transfer failed");
        lastClaimedBlock[msg.sender] = block.number;
        emit RewardsClaimed(msg.sender, rewards);
    }

    function calculateRewards(address user) public view returns (uint256) {
        Stake[] storage userStakes = stakes[user];
        uint256 totalRewards = 0;
        uint256 lastClaimed = lastClaimedBlock[user];
        for (uint256 i = 0; i < userStakes.length; i++) {
            uint256 endBlock = userStakes[i].endBlock == 0 ? block.number : userStakes[i].endBlock;
            if (lastClaimed < endBlock) {
                totalRewards += (endBlock - lastClaimed) * rewardRate;
            }
        }
        return totalRewards;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setRewardRate(uint256 newRewardRate) external onlyOwner {
        rewardRate = newRewardRate;
    }

    function setUnbondingPeriod(uint256 newUnbondingPeriod) external onlyOwner {
        unbondingPeriod = newUnbondingPeriod;
    }

    function setRewardDelay(uint256 newRewardDelay) external onlyOwner {
        rewardDelay = newRewardDelay;
    }

    function pauseStaking() external onlyOwner {
        _pause();
    }

    function unpauseStaking() external onlyOwner {
        _unpause();
    }
}
