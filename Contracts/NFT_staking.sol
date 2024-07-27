// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "./Interfaces/INFTStaking.sol";

contract NFTStaking is INFTStaking, Ownable, UUPSUpgradeable {
    IERC20 public rewardToken;
    IERC721 public nft;
    uint256 public override rewardRate;
    bool public paused;

    struct StakeInfo
    {
        uint256 startBlock;
        uint256 tokenID;
        bool unstaking;
        uint256 unstakeStartBlock;
    }
    mapping(address => StakeInfo[])public stakes;
    mapping(address=>uint256) public override rewards;


    function initialize(
        address _rewardToken,
        address _nft,
        uint256 _rewardRate,
        uint256 _unbondingPeriod
    )public initializer{
        _Ownable_init();
        _UUPSUpgradable_init();
        rewardToken=_rewardToken;
        rewardRate=_rewardRate;
        nft=IERC721(_nft);
        unbondingPeriod=_unbondingPeriod;
        paused=false;
    }

    function setRewardRate(uint256 _rewardRate) external override onlyOwner{
        rewardrate =_rewardRate
    }

    function pause()external override onlyOwner{
        paused =true;
    }
    function unpause() external override OnlyOwner{
        paused =false;
    }

    modifier when_unPaused(){
        require(!paused,"Staking is paused");
        _;
    }


    function stake(uint256 tokenID)external override when_unPaused{
        nft.transferFrom(msg.sender,address(this),tokenID);
        stakes[msg.sender].push(StakeInfo(block.number,tokenID,false,0));
    }
    function unstake(uint256 _tokenID)external override when_unPaused{
        for(uint256 i=0; i<stakes[msg.sender].length; i++){
            if( stakes[msg.sender][i].tokenID==_tokenID && !stakes[msg.sender][i].unstaking){
                stakes[msg.sender][i].unstaking=true;
                stakes[msg.sender][i].unstakeStartBlock=block.number;
                uint256 stakingDuration =block.number -stakes[msg.sender][i].startBlock;
                rewards[msg.sender]+=stakingduration*rewardRate;
                break;
            }
        }
    }

    function withdraw(uint256 _tokenID)external when_unPaused{
        for(uint256 i=0; i<stakes[msg.sender].length; i++){
            if( stakes[msg.sender][i].tokenID==_tokenID && !stakes[msg.sender][i].unstaking){
                require(block.number >=stakes[msg.sender][i].unstakeStartBlock+unbondingPeriod,"Unbonding period is not over yet. Please Try again later.");
                nft.transferFrom(address(this),msg.sender,_tokenID);
                stakes[msg.sender][i]=stakes[msg.sender][stakes[msg.sender].length-1];
                stakes[msg.sender].pop();
                break;
            }
        }
    }

    function claimRewards()external override when_unPaused{
        uint256 reward=calculaterewards(msg.sender);
        rewards[msg.sender]=0;
        rewardToken.transfer(msg.sender,reward);
    }
    function calculateRewards(address staker)publicview override returns(uint256){
        uint256 totalreward=rewards[staker];
        for(uint256 i=0;i<stakes[staker];i++){
            StakeInfo storage stake=stakes[stakerr][i];
            f(!stake.unstaking){
                uint256 stakingDuration=block.number-stake.stake.startBlock;
                totalReward+=stakingduration*rewardRate;
            }
        }
        return totalReward;
    }
    function stakes(address staker) external view override returns (StakeInfo[] memory) {
        return stakes[staker];
    }
}
