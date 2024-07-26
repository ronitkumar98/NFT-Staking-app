//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface INFTStaking{
    //Owner only functions
    function setRewardRate(uint256 _rewardrate)external;
    function pause()external;
    function unpause()external;
    function _allowUpgarde(address newImp_add)external;

    //Functions which can be used by anyone
    function stake(uint256 TokenID)external;
    function unstake(uint256 tokenID)external;
    function claimRewards()external;
    function calculateReward(address staker)external view returns(uint256);

    //extra functions for showing the rates and other crieria for the staking and unstaking period. All teh functions here are view by nature
    function rewardRate()external view returns(uint256);
    function unbondingPeriod()external view returns (uint256);
}