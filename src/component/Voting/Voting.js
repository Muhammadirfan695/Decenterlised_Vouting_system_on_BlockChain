// Node modules
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Components
import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";

// Contract
import getWeb3 from "../../getWeb3";
import { address, abi } from "../../contracts/Election";

// CSS
import "./Voting.css";

const Voting = () => {
  const [ElectionInstance, setElectionInstance] = useState(undefined);
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [candidateCount, setCandidateCount] = useState(undefined);
  const [candidates, setCandidates] = useState([]);
  const [isElStarted, setIsElStarted] = useState(false);
  const [isElEnded, setIsElEnded] = useState(false);
  const [currentVoter, setCurrentVoter] = useState({
    address: undefined,
    name: null,
    phone: null,
    hasVoted: false,
    isVerified: false,
    isRegistered: false,
  });

  useEffect(() => {
    const initializeWeb3 = async () => {
      try {
        // Get network provider and web3 instance.
        const web3 = await getWeb3();

        // Use web3 to get the user's accounts.
        const accounts = await web3.eth.getAccounts();

        // Get the contract instance.
        const networkId = await web3.eth.net.getId();
        const instance = new web3.eth.Contract(abi, address);

        // Set web3, accounts, and contract to the state, and then proceed with an
        // example of interacting with the contract's methods.
        setWeb3(web3);
        setElectionInstance(instance);
        setAccount(accounts[0]);

        // Get total number of candidates
        const candidateCount = await instance.methods.getTotalCandidate().call();
        setCandidateCount(candidateCount);

        // Get start and end values
        const start = await instance.methods.getStart().call();
        setIsElStarted(start);
        const end = await instance.methods.getEnd().call();
        setIsElEnded(end);

        // Loading Candidates details
        const loadedCandidates = [];
        for (let i = 1; i <= candidateCount; i++) {
          const candidate = await instance.methods.candidateDetails(i - 1).call();
          loadedCandidates.push({
            id: candidate.candidateId,
            header: candidate.header,
            slogan: candidate.slogan,
          });
        }
        setCandidates(loadedCandidates);

        // Loading current voter
        const voter = await instance.methods.voterDetails(accounts[0]).call();
        setCurrentVoter({
          address: voter.voterAddress,
          name: voter.name,
          phone: voter.phone,
          hasVoted: voter.hasVoted,
          isVerified: voter.isVerified,
          isRegistered: voter.isRegistered,
        });

        // Admin account and verification
        const admin = await instance.methods.getAdmin().call();
        if (accounts[0] === admin) {
          setIsAdmin(true);
        }
      } catch (error) {
        // Catch any errors for any of the above operations.
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`
        );
        console.error(error);
      }
    };

    // refreshing once
    if (!window.location.hash) {
      window.location = window.location + "#loaded";
      window.location.reload();
    }

    initializeWeb3();
  }, []);

  const castVote = async (id) => {
    await ElectionInstance.methods.vote(id).send({ from: account, gas: 1000000 });
    window.location.reload();
  };

  const confirmVote = (id, header) => {
    var r = window.confirm(
      "Vote for " + header + " with Id " + id + ".\nAre you sure?"
    );
    if (r === true) {
      castVote(id);
    }
  };

  const renderCandidates = (candidate) => {
    return (
      <div className="container-item" key={candidate.id}>
        <div className="candidate-info">
          <h2>
            {candidate.header} <small>#{candidate.id}</small>
          </h2>
          <p className="slogan">{candidate.slogan}</p>
        </div>
        <div className="vote-btn-container">
          <button
            onClick={() => confirmVote(candidate.id, candidate.header)}
            className="vote-bth"
            disabled={
              !currentVoter.isRegistered ||
              !currentVoter.isVerified ||
              currentVoter.hasVoted
            }
          >
            Vote
          </button>
        </div>
      </div>
    );
  };

  if (!web3) {
    return (
      <>
        {isAdmin ? <NavbarAdmin /> : <Navbar />}
        <center>Loading Web3, accounts, and contract...</center>
      </>
    );
  }

  return (
    <>
      {isAdmin ? <NavbarAdmin /> : <Navbar />}
      <div>
        {!isElStarted && !isElEnded ? (
          <NotInit />
        ) : isElStarted && !isElEnded ? (
          <>
            {currentVoter.isRegistered ? (
              currentVoter.isVerified ? (
                currentVoter.hasVoted ? (
                  <div className="container-item success">
                    <div>
                      <strong>You've casted your vote.</strong>
                      <p />
                      <center>
                        <Link
                          to="/Results"
                          style={{
                            color: "black",
                            textDecoration: "underline",
                          }}
                        >
                          See Results
                        </Link>
                      </center>
                    </div>
                  </div>
                ) : (
                  <div className="container-item info">
                    <center>Go ahead and cast your vote.</center>
                  </div>
                )
              ) : (
                <div className="container-item attention">
                  <center>Please wait for admin to verify.</center>
                </div>
              )
            ) : (
              <>
                <div className="container-item attention">
                  <center>
                    <p>You're not registered. Please register first.</p>
                    <br />
                    <Link
                      to="/Registration"
                      style={{ color: "black", textDecoration: "underline" }}
                    >
                      Registration Page
                    </Link>
                  </center>
                </div>
              </>
            )}
            <div className="container-main">
              <h2>Candidates</h2>
              <small>Total candidates: {candidates.length}</small>
              {candidates.length < 1 ? (
                <div className="container-item attention">
                  <center>Not one to vote for.</center>
                </div>
              ) : (
                <>
                  {candidates.map(renderCandidates)}
                  <div
                    className="container-item"
                    style={{ border: "1px solid black" }}
                  >
                    <center>That is all.</center>
                  </div>
                </>
              )}
            </div>
          </>
        ) : !isElStarted && isElEnded ? (
          <>
            <div className="container-item attention">
              <center>
                <h3>The Election ended.</h3>
                <br />
                <Link
                  to="/Results"
                  style={{ color: "black", textDecoration: "underline" }}
                >
                  See results
                </Link>
              </center>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
};

export default Voting;
