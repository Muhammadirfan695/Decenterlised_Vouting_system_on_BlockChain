import React, { useState, useEffect } from "react";
import Navbar from "../../Navbar/Navigation";
import NavbarAdmin from "../../Navbar/NavigationAdmin";
import getWeb3 from "../../../getWeb3";
import { address, abi } from "../../../contracts/Election";
import AdminOnly from "../../AdminOnly";
import "./AddCandidate.css";

export default function AddCandidate() {
  const [ElectionInstance, setElectionInstance] = useState(undefined);
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [header, setHeader] = useState("");
  const [slogan, setSlogan] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [candidateCount, setCandidateCount] = useState(undefined);

  useEffect(() => {
    if (!window.location.hash) {
      window.location = window.location + "#loaded";
      window.location.reload();
    }

    const fetchData = async () => {
      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        // const networkId = await web3.eth.net.getId();
        const instance = new web3.eth.Contract(abi, address);

        setWeb3(web3);
        setElectionInstance(instance);
        setAccounts(accounts);

        const candidateCount = await instance.methods.getTotalCandidate().call();
        setCandidateCount(candidateCount);

        const admin = await instance.methods.getAdmin().call();
        setIsAdmin(accounts[0] === admin);

        const loadedCandidates = [];
        for (let i = 0; i < candidateCount; i++) {
          const candidate = await instance.methods.candidateDetails(i).call();
          loadedCandidates.push({
            id: candidate.candidateId,
            header: candidate.header,
            slogan: candidate.slogan,
          });
        }
        setCandidates(loadedCandidates);
      } catch (error) {
        console.error(error);
        alert("Failed to load web3, accounts, or contract. Check console for details.");
      }
    };

  fetchData();
  }, []);

  const updateHeader = (event) => {
    setHeader(event.target.value);
  };

  const updateSlogan = (event) => {
    setSlogan(event.target.value);
  };

  const addCandidate = async () => {
    await ElectionInstance.methods
      .addCandidate(header, slogan)
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
        <AdminOnly page="Add Candidate Page." />
      </>
    );
  }

  return (
    <>
      <NavbarAdmin />
      <div className="container-main">
        <h2>Add a new candidate</h2>
        <small>Total candidates: {candidateCount}</small>
        <div className="container-item">
          <form className="form">
            <label className={"label-ac"}>
              candidate Name
              <input
                className={"input-ac"}
                type="text"
                placeholder="Candidate"
                value={header}
                onChange={updateHeader}
              />
            </label>
            <label className={"label-ac"}>
              Party Name
              <input
                className={"input-ac"}
                type="text"
                placeholder="Party Name"
                value={slogan}
                onChange={updateSlogan}
              />
            </label>
            <button
              className="btn-add"
              disabled={header.length < 3 || header.length > 21}
              onClick={addCandidate}
            >
              Add
            </button>
          </form>
        </div>
      </div>
      {loadAdded(candidates)}
    </>
  );
}

export function loadAdded(candidates) {
  const renderAdded = (candidate) => {
    return (
      <>
        <div className="container-list success">
          <div
            style={{
              maxHeight: "21px",
              overflow: "auto",
            }}
          >
            {candidate.id}. <strong>{candidate.header}</strong>: {candidate.slogan}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="container-main" style={{ borderTop: "1px solid" }}>
      <div className="container-item info">
        <center>Candidates List</center>
      </div>
      {candidates.length < 1 ? (
        <div className="container-item alert">
          <center>No candidates added.</center>
        </div>
      ) : (
        <div
          className="container-item"
          style={{
            display: "block",
            backgroundColor: "#DDFFFF",
          }}
        >
          {candidates.map(renderAdded)}
        </div>
      )}
    </div>
  );
}
