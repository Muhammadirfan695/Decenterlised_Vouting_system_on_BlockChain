import React, { useState, useEffect } from "react";
import Navbar from "../../Navbar/Navigation";
import NavbarAdmin from "../../Navbar/NavigationAdmin";
import AdminOnly from "../../AdminOnly";
import getWeb3 from "../../../getWeb3";
import Election from "../../../contracts/Election.json";
import "./StartEnd.css";

const StartEnd = () => {
  const [ElectionInstance, setElectionInstance] = useState(undefined);
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [elStarted, setElStarted] = useState(false);
  const [elEnded, setElEnded] = useState(false);

  useEffect(() => {
    const initWeb3 = async () => {
      // refreshing page only once
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
        const deployedNetwork = Election.networks[networkId];
        const instance = new web3.eth.Contract(
          Election.abi,
          deployedNetwork && deployedNetwork.address
        );

        // Set web3, accounts, and contract to the state
        setWeb3(web3);
        setElectionInstance(instance);
        setAccounts(accounts);
        
        // Admin info
        const admin = await instance.methods.getAdmin().call();
        if (accounts[0] === admin) {
          setIsAdmin(true);
        }

        // Get election start and end values
        const start = await instance.methods.getStart().call();
        setElStarted(start);
        const end = await instance.methods.getEnd().call();
        setElEnded(end);
      } catch (error) {
        // Catch any errors for any of the above operations.
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`
        );
        console.error(error);
      }
    };

    initWeb3();
  }, []);

  const startElection = async () => {
    await ElectionInstance.methods
      .startElection()
      .send({ from: accounts[0], gas: 1000000 });
    window.location.reload();
  };

  const endElection = async () => {
    await ElectionInstance.methods
      .endElection()
      .send({ from: accounts[0], gas: 1000000 });
    window.location.reload();
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
        <AdminOnly page="Start and end election page." />
      </>
    );
  }

  return (
    <>
      <NavbarAdmin />
      {!elStarted && !elEnded ? (
        <div className="container-item info">
          <center>The election has never been initiated.</center>
        </div>
      ) : null}
      <div className="container-main">
        <h3>Start or end election</h3>
        {!elStarted ? (
          <>
            <div className="container-item">
              <button onClick={startElection} className="start-btn">
                Start {elEnded ? "Again" : null}
              </button>
            </div>
            {elEnded ? (
              <div className="container-item">
                <center>
                  <p>The election ended.</p>
                </center>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="container-item">
              <center>
                <p>The election started.</p>
              </center>
            </div>
            <div className="container-item">
              <button onClick={endElection} className="start-btn">
                End
              </button>
            </div>
          </>
        )}
        <div className="election-status">
          <p>Started: {elStarted ? "True" : "False"}</p>
          <p>Ended: {elEnded ? "True" : "False"}</p>
        </div>
      </div>
    </>
  );
};

export default StartEnd;
