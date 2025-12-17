// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Secret voting contract using Zama FHEVM
// Votes are encrypted and stored on-chain
// Only poll creator can reveal results after poll ends
contract SecretVoting {
    struct Poll {
        address creator;
        string question;
        string[] options;
        bytes32[] encryptedVotes; // Encrypted votes (bytes32 = handle for euint8)
        address[] voters;
        mapping(address => bool) hasVoted;
        bool isActive;
        bool resultsRevealed;
        uint256 createdAt;
        uint256 endTime;
        uint256[] results; // Revealed results (counts per option)
    }

    mapping(uint256 => Poll) public polls;
    uint256 public pollCounter;
    
    mapping(address => uint256[]) public userPolls;
    mapping(address => uint256[]) public userVotes;

    event PollCreated(
        uint256 indexed pollId,
        address indexed creator,
        string question,
        uint256 endTime
    );
    
    event VoteCast(
        uint256 indexed pollId,
        address indexed voter
    );
    
    event ResultsRevealed(
        uint256 indexed pollId,
        uint256[] results
    );
    
    event PollEnded(uint256 indexed pollId);

    // Create a new poll
    function createPoll(
        string memory question,
        string[] memory options,
        uint256 duration
    ) external returns (uint256) {
        require(bytes(question).length > 0, "Question cannot be empty");
        require(options.length >= 2, "Need at least 2 options");
        require(options.length <= 10, "Maximum 10 options");
        require(duration > 0, "Duration must be positive");

        uint256 pollId = pollCounter;
        pollCounter++;

        Poll storage poll = polls[pollId];
        poll.creator = msg.sender;
        poll.question = question;
        poll.options = options;
        poll.isActive = true;
        poll.resultsRevealed = false;
        poll.createdAt = block.timestamp;
        poll.endTime = block.timestamp + duration;
        poll.results = new uint256[](options.length);

        userPolls[msg.sender].push(pollId);

        emit PollCreated(pollId, msg.sender, question, poll.endTime);
        return pollId;
    }

    // Cast an encrypted vote
    function castVote(
        uint256 pollId,
        bytes32 encryptedVote,
        bytes calldata /* attestation */
    ) external {
        Poll storage poll = polls[pollId];
        require(poll.isActive, "Poll is not active");
        require(block.timestamp < poll.endTime, "Poll has ended");
        require(!poll.hasVoted[msg.sender], "Already voted");
        require(encryptedVote != bytes32(0), "Invalid encrypted vote");

        // TODO: validate attestation with FHE.fromExternal in real implementation

        poll.encryptedVotes.push(encryptedVote);
        poll.voters.push(msg.sender);
        poll.hasVoted[msg.sender] = true;

        userVotes[msg.sender].push(pollId);

        emit VoteCast(pollId, msg.sender);
    }

    // Reveal results (only creator can do this after poll ends)
    function revealResults(
        uint256 pollId,
        uint256[] memory results
    ) external {
        Poll storage poll = polls[pollId];
        require(msg.sender == poll.creator, "Only creator can reveal");
        require(!poll.resultsRevealed, "Results already revealed");
        require(block.timestamp >= poll.endTime || !poll.isActive, "Poll still active");
        require(results.length == poll.options.length, "Invalid results length");

        poll.results = results;
        poll.resultsRevealed = true;
        poll.isActive = false;

        emit ResultsRevealed(pollId, results);
        emit PollEnded(pollId);
    }

    // End poll early (only creator)
    function endPoll(uint256 pollId) external {
        Poll storage poll = polls[pollId];
        require(msg.sender == poll.creator, "Only creator can end poll");
        require(poll.isActive, "Poll already ended");
        
        poll.isActive = false;
        emit PollEnded(pollId);
    }

    // Get poll info
    function getPoll(uint256 pollId) external view returns (
        address creator,
        string memory question,
        string[] memory options,
        bool isActive,
        bool resultsRevealed,
        uint256 createdAt,
        uint256 endTime,
        uint256 voteCount
    ) {
        Poll storage poll = polls[pollId];
        return (
            poll.creator,
            poll.question,
            poll.options,
            poll.isActive,
            poll.resultsRevealed,
            poll.createdAt,
            poll.endTime,
            poll.voters.length
        );
    }

    // Get results (only if revealed)
    function getResults(uint256 pollId) external view returns (
        uint256[] memory results,
        bool revealed
    ) {
        Poll storage poll = polls[pollId];
        return (poll.results, poll.resultsRevealed);
    }

    // Get vote count
    function getVoteCount(uint256 pollId) external view returns (uint256) {
        return polls[pollId].voters.length;
    }

    // Check if user voted
    function hasVoted(uint256 pollId, address voter) external view returns (bool) {
        return polls[pollId].hasVoted[voter];
    }

    // Get polls created by user
    function getUserPolls(address user) external view returns (uint256[] memory) {
        return userPolls[user];
    }

    // Get polls user voted in
    function getUserVotes(address user) external view returns (uint256[] memory) {
        return userVotes[user];
    }
}

