import React, { useEffect, useState } from "react";

import Navbar from "../../Navbar/Navigation";
import NavbarAdmin from "../../Navbar/NavigationAdmin";

import AdminOnly from "../../AdminOnly";

import getWeb3 from "../../../getWeb3";
import { address, abi } from "../../../contracts/Election";

import "./Verification.css";

const Verification = () => {
  const [ElectionInstance, setElectionInstance] = useState(undefined);
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [voterCount, setVoterCount] = useState(undefined);
  const [voters, setVoters] = useState([]);

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

        // Total number of candidates
        const candidateCount = await instance.methods.getTotalCandidate().call();
        // Set candidateCount state
        // setCandidateCount(candidateCount);

        // Admin account and verification
        const admin = await instance.methods.getAdmin().call();
        if (accounts[0] === admin) {
          setIsAdmin(true);
        }
        // Total number of voters
        const voterCount = await instance.methods.getTotalVoter().call();
        setVoterCount(voterCount);

        // Loading all the voters
        const loadedVoters = [];
        for (let i = 0; i < voterCount; i++) {
          const voterAddress = await instance.methods.voters(i).call();
          const voter = await instance.methods.voterDetails(voterAddress).call();
          loadedVoters.push({
            address: voter.voterAddress,
            name: voter.name,
            phone: voter.phone,
            hasVoted: voter.hasVoted,
            isVerified: voter.isVerified,
            isRegistered: voter.isRegistered,
          });
        }
        setVoters(loadedVoters);
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

  const verifyVoter = async (verifiedStatus, address) => {
    await ElectionInstance.methods
      .verifyVoter(verifiedStatus, address)
      .send({ from: account, gas: 1000000 });
    window.location.reload();
  };

  const renderUnverifiedVoters = (voter) => {
    return (
      <>
        {voter.isVerified ? (
          <div className="container-list success">
            <p style={{ margin: "7px 0px" }}>AC: {voter.address}</p>
            <table>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Voted</th>
              </tr>
              <tr>
                <td>{voter.name}</td>
                <td>{voter.phone}</td>
                <td>{voter.hasVoted ? "True" : "False"}</td>
              </tr>
            </table>
          </div>
        ) : null}
        <div
          className="container-list attention"
          style={{ display: voter.isVerified ? "none" : null }}
        >
          <table>
            <tr>
              <th>Account address</th>
              <td>{voter.address}</td>
            </tr>
            <tr>
              <th>Name</th>
              <td>{voter.name}</td>
            </tr>
            <tr>
              <th>Phone</th>
              <td>{voter.phone}</td>
            </tr>
            <tr>
              <th>Voted</th>
              <td>{voter.hasVoted ? "True" : "False"}</td>
            </tr>
            <tr>
              <th>Verified</th>
              <td>{voter.isVerified ? "True" : "False"}</td>
            </tr>
            <tr>
              <th>Registered</th>
              <td>{voter.isRegistered ? "True" : "False"}</td>
            </tr>
          </table>
          <div style={{}}>
            <button
              className="btn-verification approve"
              disabled={voter.isVerified}
              onClick={() => verifyVoter(true, voter.address)}
            >
              Approve
            </button>
          </div>
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

  if (!isAdmin) {
    return (
      <>
        <Navbar />
        <AdminOnly page="Verification Page." />
      </>
    );
  }

  return (
    <>
      <NavbarAdmin />
      <div className="container-main">
        <h3>Verification</h3>
        <small>Total Voters: {voters.length}</small>
        {voters.length < 1 ? (
          <div className="container-item info">None has registered yet.</div>
        ) : (
          <>
            <div className="container-item info">
              <center>List of registered voters</center>
            </div>
            {voters.map(renderUnverifiedVoters)}
          </>
        )}
      </div>
    </>
  );
};

export default Verification;
