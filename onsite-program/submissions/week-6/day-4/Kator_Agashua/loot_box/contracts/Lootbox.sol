// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract LootBox is VRFConsumerBaseV2, Ownable {
    enum RewardType { ERC20, ERC721, ERC1155 }

    struct Reward {
        RewardType rewardType;
        address tokenAddress;
        uint256 tokenIdOrAmount;
        uint256 weight;
    }

    uint256 public boxFee;
    Reward[] public rewards;
    uint256 public totalWeight;

    // Chainlink VRF
    VRFCoordinatorV2Interface COORDINATOR;
    uint64 public subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit = 200000;
    uint16 public requestConfirmations = 3;

    mapping(uint256 => address) public requestToSender;

    event BoxOpened(address indexed user, uint256 indexed requestId);
    event RewardAssigned(address indexed user, RewardType rewardType, address tokenAddress, uint256 tokenIdOrAmount);

    constructor(
        uint64 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint256 _boxFee
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        boxFee = _boxFee;
    }

    function setBoxFee(uint256 _fee) external onlyOwner {
        boxFee = _fee;
    }

    function addReward(
        RewardType rewardType,
        address tokenAddress,
        uint256 tokenIdOrAmount,
        uint256 weight
    ) external onlyOwner {
        rewards.push(Reward(rewardType, tokenAddress, tokenIdOrAmount, weight));
        totalWeight += weight;
    }

    function openBox() external payable {
        require(msg.value >= boxFee, "Insufficient fee");
        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            1
        );
        requestToSender[requestId] = msg.sender;
        emit BoxOpened(msg.sender, requestId);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address user = requestToSender[requestId];
        uint256 rand = randomWords[0] % totalWeight;
        uint256 cumulative = 0;

        for (uint256 i = 0; i < rewards.length; i++) {
            cumulative += rewards[i].weight;
            if (rand < cumulative) {
                distributeReward(user, rewards[i]);
                emit RewardAssigned(user, rewards[i].rewardType, rewards[i].tokenAddress, rewards[i].tokenIdOrAmount);
                break;
            }
        }
    }

    function distributeReward(address user, Reward memory reward) internal {
        if (reward.rewardType == RewardType.ERC20) {
            IERC20(reward.tokenAddress).transfer(user, reward.tokenIdOrAmount);
        } else if (reward.rewardType == RewardType.ERC721) {
            IERC721(reward.tokenAddress).safeTransferFrom(address(this), user, reward.tokenIdOrAmount);
        } else if (reward.rewardType == RewardType.ERC1155) {
            IERC1155(reward.tokenAddress).safeTransferFrom(address(this), user, reward.tokenIdOrAmount, 1, "");
        }
    }

    // Emergency function to remove a reward (optional enhancement)
    function removeReward(uint256 index) external onlyOwner {
        require(index < rewards.length, "Invalid index");
        totalWeight -= rewards[index].weight;
        rewards[index] = rewards[rewards.length - 1];
        rewards.pop();
    }

    // Withdraw contract balance
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // View functions
    function getRewards() external view returns (Reward[] memory) {
        return rewards;
    }

    function getRewardCount() external view returns (uint256) {
        return rewards.length; // Fixed: was "rewards.Length"
    }

    // Additional helper function to check reward probability
    function getRewardProbability(uint256 index) external view returns (uint256) {
        require(index < rewards.length, "Invalid index");
        if (totalWeight == 0) return 0;
        return (rewards[index].weight * 10000) / totalWeight; // Returns basis points (0.01%)
    }
}