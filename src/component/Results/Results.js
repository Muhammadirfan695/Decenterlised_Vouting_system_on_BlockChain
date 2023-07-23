import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";

import getWeb3 from "../../getWeb3";
import { address, abi } from "../../contracts/Election";

import "./Results.css";

const Result = () => {
  const [ElectionInstance, setElectionInstance] = useState(undefined);
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [candidateCount, setCandidateCount] = useState(undefined);
  const [candidates, setCandidates] = useState([]);
  const [isElStarted, setIsElStarted] = useState(false);
  const [isElEnded, setIsElEnded] = useState(false);

  useEffect(() => {
    const initializeWeb3 = async () => {
      if (!window.location.hash) {
        window.location = window.location + "#loaded";
        window.location.reload();
      }
      try {
        // Get network provider and web3 instance.
        const web3 = await getWeb3();

        // Use web3 to get the user's accounts.
        const accounts = await web3.eth.getAccounts();

        // Get the contract instance.
        const networkId = await web3.eth.net.getId();
        const instance = new web3.eth.Contract(abi, address);

        // Set web3, accounts, and contract to the state.
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

        // Load Candidates details
        const loadedCandidates = [];
        for (let i = 1; i <= candidateCount; i++) {
          const candidate = await instance.methods.candidateDetails(i - 1).call();
          loadedCandidates.push({
            id: candidate.candidateId,
            header: candidate.header,
            slogan: candidate.slogan,
            voteCount: candidate.voteCount,
          });
        }
        setCandidates(loadedCandidates);

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

    initializeWeb3();
  }, []);

  const displayWinner = (candidates) => {
    const getWinner = (candidates) => {
      let maxVoteRecived = 0;
      let winnerCandidates = [];
      for (let i = 0; i < candidates.length; i++) {
        if (candidates[i].voteCount > maxVoteRecived) {
          maxVoteRecived = candidates[i].voteCount;
          winnerCandidates = [candidates[i]];
        } else if (candidates[i].voteCount === maxVoteRecived) {
          winnerCandidates.push(candidates[i]);
        }
      }
      return winnerCandidates;
    };

    const renderWinner = (winner) => {
      return (
        <div className="container-winner">
          <div className="winner-info">
            <p className="winner-tag">Winner!</p>
            <h2>{winner.header}</h2>
            <p className="winner-slogan">{winner.slogan}</p>
          </div>
          <div className="winner-votes">
            <div className="votes-tag">Total Votes:</div>
            <div className="vote-count">{winner.voteCount}</div>
          </div>
        </div>
      );
    };

    const winnerCandidates = getWinner(candidates);
    return <>{winnerCandidates.map(renderWinner)}</>;
  };

  const displayResults = (candidates) => {
    const renderResults = (candidate) => {
      return (
        <tr key={candidate.id}>
          <td>{candidate.id}</td>
          <td>{candidate.header}</td>
          <td>{candidate.voteCount}</td>
        </tr>
      );
    };

    return (
      <>
        {candidates.length > 0 ? (
          <div className="container-main">{displayWinner(candidates)}</div>
        ) : null}
        <div className="container-main" style={{ borderTop: "1px solid" }}>
          <h2>Results</h2>
          <small>Total candidates: {candidates.length}</small>
          {candidates.length < 1 ? (
            <div className="container-item attention">
              <center>No candidates.</center>
            </div>
          ) : (
            <>
              <div className="container-item">
                <table>
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Candidate</th>
                      <th>Votes</th>
                    </tr>
                  </thead>
                  <tbody>{candidates.map(renderResults)}</tbody>
                </table>
              </div>
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
      <br />
      <div>
        {!isElStarted && !isElEnded ? (
          <NotInit />
        ) : isElStarted && !isElEnded ? (
          <div className="container-item attention">
            <center>
              <h3>The election is being conducted at the moment.</h3>
              <p>Results will be displayed once the election has ended.</p>
              <p>Go ahead and cast your vote (if not already).</p>
              <br />
              <Link
                to="/Voting"
                style={{ color: "black", textDecoration: "underline" }}
              >
                Voting Page
              </Link>
            </center>
          </div>
        ) : !isElStarted && isElEnded ? (
          displayResults(candidates)
        ) : null}
      </div>
    </>
  );
};

export default Result;
