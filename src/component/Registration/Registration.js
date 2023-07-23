// Node modules
import React, { useState, useEffect } from "react";

// Components
import Navbar from "../Navbar/Navigation";
import NavbarAdmin from "../Navbar/NavigationAdmin";
import NotInit from "../NotInit";

// CSS
import "./Registration.css";

// Contract
import getWeb3 from "../../getWeb3";
import { address, abi } from "../../contracts/Election";

export default function Registration() {
  const [ElectionInstance, setElectionInstance] = useState(undefined);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isElStarted, setIsElStarted] = useState(false);
  const [isElEnded, setIsElEnded] = useState(false);
  const [voterName, setVoterName] = useState("");
  const [voterPhone, setVoterPhone] = useState("");
  const [voters, setVoters] = useState([]);
  const [currentVoter, setCurrentVoter] = useState({
    address: undefined,
    name: null,
    phone: null,
    hasVoted: false,
    isVerified: false,
    isRegistered: false,
  });

  // Refreshing once
  useEffect(() => {
    if (!window.location.hash) {
      window.location = window.location + "#loaded";
      window.location.reload();
    }
    async function loadWeb3() {
      try {
        // Get network provider and web3 instance.
        const web3 = await getWeb3();
        console.log(web3, "web3");
        // Use web3 to get the user's accounts.
        const accounts = await web3.eth.getAccounts();

        // Get the contract instance.
        const networkId = await web3.eth.net.getId();
        const instance = new web3.eth.Contract(abi, address);
        console.log(instance, "instance");

        // Set web3, accounts, and contract to the state, and then proceed with an
        // example of interacting with the contract's methods.
        setWeb3(web3);
        setElectionInstance(instance);
        setAccount(accounts[0]);

        // Admin account and verification
        const admin = await instance.methods.getAdmin().call();
        if (accounts[0] === admin) {
          setIsAdmin(true);
        }

        // Get start and end values
        const start = await instance.methods.getStart().call();
        setIsElStarted(start);
        const end = await instance.methods.getEnd().call();
        setIsElEnded(end);

        // Loading all the voters
        const voterCount = await instance.methods.getTotalVoter().call();
        const tempVoters = [];
        for (let i = 0; i < voterCount; i++) {
          const voterAddress = await instance.methods.voters(i).call();
          const voter = await instance.methods.voterDetails(voterAddress).call();
          tempVoters.push({
            address: voter.voterAddress,
            name: voter.name,
            phone: voter.phone,
            hasVoted: voter.hasVoted,
            isVerified: voter.isVerified,
            isRegistered: voter.isRegistered,
          });
        }
        setVoters(tempVoters);

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
      } catch (error) {
        // Catch any errors for any of the above operations.
        console.error(error);
        alert(
          `Failed to load web3, accounts, or contract. Check console for details (f12).`
        );
      }
    }

    loadWeb3();
  }, []);

  const updateVoterName = (event) => {
    setVoterName(event.target.value);
  };

  const updateVoterPhone = (event) => {
    setVoterPhone(event.target.value);
  };

  const registerAsVoter = async () => {
    await ElectionInstance.methods
      .registerAsVoter(voterName, voterPhone)
      .send({ from: account, gas: 1000000 });
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

  return (
    <>
      {isAdmin ? <NavbarAdmin /> : <Navbar />}
      {!isElStarted && !isElEnded ? (
        <NotInit />
      ) : (
        <>
          <div className="container-item info">
            <p>Total registered voters: {voters.length}</p>
          </div>
          <div className="container-main">
            <h3>Registration</h3>
            <small>Register to vote.</small>
            <div className="container-item">
              <form>
                <div className="div-li">
                  <label className={"label-r"}>
                    Account Address
                    <input
                      className={"input-r"}
                      type="text"
                      value={account}
                      style={{ width: "400px" }}
                    />{" "}
                  </label>
                </div>
                <div className="div-li">
                  <label className={"label-r"}>
                    Name
                    <input
                      className={"input-r"}
                      type="text"
                      placeholder="eg. name"
                      value={voterName}
                      onChange={updateVoterName}
                    />{" "}
                  </label>
                </div>
                <div className="div-li">
                  <label className={"label-r"}>
                    CNIC <span style={{ color: "tomato" }}>*</span>
                    <input
                      className={"input-r"}
                      type="CNIC"
                      placeholder="eg.333044263597"
                      value={voterPhone}
                      onChange={updateVoterPhone}
                    />
                  </label>
                </div>
                <p className="note">
                  <span style={{ color: "tomato" }}> Note: </span>
                  <br /> Make sure your account address and CNIC are correct.{" "}
                  <br /> Admin might not approve your account if the provided
                  CNIC NUMBER does not match the account address registered in
                  the admin's catalog.
                </p>
                <button
                  className="btn-add"
                  disabled={voterPhone.length !== 10 || currentVoter.isVerified}
                  onClick={registerAsVoter}
                >
                  {currentVoter.isRegistered ? "Update" : "Register"}
                </button>
              </form>
            </div>
          </div>
          <div
            className="container-main"
            style={{
              borderTop: currentVoter.isRegistered ? null : "1px solid",
            }}
          >
            {loadCurrentVoter(
              currentVoter,
              currentVoter.isRegistered
            )}
          </div>
          {isAdmin ? (
            <div
              className="container-main"
              style={{ borderTop: "1px solid" }}
            >
              <small>TotalVoters: {voters.length}</small>
              {loadAllVoters(voters)}
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

export function loadCurrentVoter(voter, isRegistered) {
  return (
    <>
      <div
        className={"container-item " + (isRegistered ? "success" : "attention")}
      >
        <center>Your Registered Info</center>
      </div>
      <div
        className={"container-list " + (isRegistered ? "success" : "attention")}
      >
        <table>
          <tr>
            <th>Account Address</th>
            <td>{voter.address}</td>
          </tr>
          <tr>
            <th>Name</th>
            <td> {voter.name}</td>
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
            <th>Verification</th>
            <td>{voter.isVerified ? "True" : "False"}</td>
          </tr>
          <tr>
            <th>Registered</th>
            <td>{voter.isRegistered ? "True" : "False"}</td>
          </tr>
        </table>
      </div>
    </>
  );
}

export function loadAllVoters(voters) {
  const renderAllVoters = (voter) => {
    return (
      <>
        <div className="container-list success">
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
        </div>
      </>
    );
  };
  return (
    <>
      <div className="container-item success">
        <center>List of voters</center>
      </div>
      {voters.map(renderAllVoters)}
    </>
  );
}

// // Node modules
// import React, { useState, useEffect } from "react";

// // Components
// import Navbar from "../Navbar/Navigation";
// import NavbarAdmin from "../Navbar/NavigationAdmin";
// import NotInit from "../NotInit";

// // CSS
// import "./Registration.css";

// // Contract
// import getWeb3 from "../../getWeb3";
// import { address, abi } from "../../contracts/Election";

// export default function Registration() {
//   const [ElectionInstance, setElectionInstance] = useState(undefined);
//   const [web3, setWeb3] = useState(null);
//   const [account, setAccount] = useState(null);
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [isElStarted, setIsElStarted] = useState(false);
//   const [isElEnded, setIsElEnded] = useState(false);
//   const [voterCount, setVoterCount] = useState(undefined);
//   const [voterName, setVoterName] = useState("");
//   const [voterPhone, setVoterPhone] = useState("");
//   const [voters, setVoters] = useState([]);
//   const [currentVoter, setCurrentVoter] = useState({
//     address: undefined,
//     name: null,
//     phone: null,
//     hasVoted: false,
//     isVerified: false,
//     isRegistered: false,
//   });

//   // Refreshing once
//   useEffect(() => {
//     if (!window.location.hash) {
//       window.location = window.location + "#loaded";
//       window.location.reload();
//     }
//     async function loadWeb3() {
//       try {
//         // Get network provider and web3 instance.
//         const web3 = await getWeb3();
//         console.log(web3, "web3");
//         // Use web3 to get the user's accounts.
//         const accounts = await web3.eth.getAccounts();

//         // Get the contract instance.
//         const networkId = await web3.eth.net.getId();
//         const instance = new web3.eth.Contract(abi, address);
//         console.log(instance, "instance");

//         // Set web3, accounts, and contract to the state, and then proceed with an
//         // example of interacting with the contract's methods.
//         setWeb3(web3);
//         setElectionInstance(instance);
//         setAccount(accounts[0]);

//         // Admin account and verification
//         const admin = await instance.methods.getAdmin().call();
//         if (accounts[0] === admin) {
//           setIsAdmin(true);
//         }

//         // Get start and end values
//         const start = await instance.methods.getStart().call();
//         setIsElStarted(start);
//         const end = await instance.methods.getEnd().call();
//         setIsElEnded(end);

//         // Total number of voters
//         const voterCount = await instance.methods.getTotalVoter().call();
//         setVoterCount(voterCount);

//         // Loading all the voters
//         const tempVoters = [];
//         for (let i = 0; i < voterCount; i++) {
//           const voterAddress = await instance.methods.voters(i).call();
//           const voter = await instance.methods.voterDetails(voterAddress).call();
//           tempVoters.push({
//             address: voter.voterAddress,
//             name: voter.name,
//             phone: voter.phone,
//             hasVoted: voter.hasVoted,
//             isVerified: voter.isVerified,
//             isRegistered: voter.isRegistered,
//           });
//         }
//         setVoters(tempVoters);

//         // Loading current voter
//         const voter = await instance.methods.voterDetails(accounts[0]).call();
//         setCurrentVoter({
//           address: voter.voterAddress,
//           name: voter.name,
//           phone: voter.phone,
//           hasVoted: voter.hasVoted,
//           isVerified: voter.isVerified,
//           isRegistered: voter.isRegistered,
//         });
//       } catch (error) {
//         // Catch any errors for any of the above operations.
//         console.error(error);
//         alert(
//           `Failed to load web3, accounts, or contract. Check console for details (f12).`
//         );
//       }
//     }

//     loadWeb3();
//   }, []);

//   const updateVoterName = (event) => {
//     setVoterName(event.target.value);
//   };

//   const updateVoterPhone = (event) => {
//     setVoterPhone(event.target.value);
//   };

//   const registerAsVoter = async () => {
//     await ElectionInstance.methods
//       .registerAsVoter(voterName, voterPhone)
//       .send({ from: account, gas: 1000000 });
//     window.location.reload();
//   };

//   if (!web3) {
//     return (
//       <>
//         {isAdmin ? <NavbarAdmin /> : <Navbar />}
//         <center>Loading Web3, accounts, and contract...</center>
//       </>
//     );
//   }

//   return (
//     <>
//       {isAdmin ? <NavbarAdmin /> : <Navbar />}
//       {!isElStarted && !isElEnded ? (
//         <NotInit />
//       ) : (
//         <>
//           <div className="container-item info">
//             <p>Total registered voters: {voters.length}</p>
//           </div>
//           <div className="container-main">
//             <h3>Registration</h3>
//             <small>Register to vote.</small>
//             <div className="container-item">
//               <form>
//                 <div className="div-li">
//                   <label className={"label-r"}>
//                     Account Address
//                     <input
//                       className={"input-r"}
//                       type="text"
//                       value={account}
//                       style={{ width: "400px" }}
//                     />{" "}
//                   </label>
//                 </div>
//                 <div className="div-li">
//                   <label className={"label-r"}>
//                     Name
//                     <input
//                       className={"input-r"}
//                       type="text"
//                       placeholder="eg. name"
//                       value={voterName}
//                       onChange={updateVoterName}
//                     />{" "}
//                   </label>
//                 </div>
//                 <div className="div-li">
//                   <label className={"label-r"}>
//                     CNIC <span style={{ color: "tomato" }}>*</span>
//                     <input
//                       className={"input-r"}
//                       type="CNIC"
//                       placeholder="eg.333044263597"
//                       value={voterPhone}
//                       onChange={updateVoterPhone}
//                     />
//                   </label>
//                 </div>
//                 <p className="note">
//                   <span style={{ color: "tomato" }}> Note: </span>
//                   <br /> Make sure your account address and CNIC are correct.{" "}
//                   <br /> Admin might not approve your account if the provided
//                   CNIC NUMBER does not match the account address registered in
//                   the admin's catalog.
//                 </p>
//                 <button
//                   className="btn-add"
//                   disabled={voterPhone.length !== 10 || currentVoter.isVerified}
//                   onClick={registerAsVoter}
//                 >
//                   {currentVoter.isRegistered ? "Update" : "Register"}
//                 </button>
//               </form>
//             </div>
//           </div>
//           <div
//             className="container-main"
//             style={{
//               borderTop: currentVoter.isRegistered ? null : "1px solid",
//             }}
//           >
//             {loadCurrentVoter(
//               currentVoter,
//               currentVoter.isRegistered
//             )}
//           </div>
//           {isAdmin ? (
//             <div
//               className="container-main"
//               style={{ borderTop: "1px solid" }}
//             >
//               <small>TotalVoters: {voters.length}</small>
//               {loadAllVoters(voters)}
//             </div>
//           ) : null}
//         </>
//       )}
//     </>
//   );
// }

// export function loadCurrentVoter(voter, isRegistered) {
//   return (
//     <>
//       <div
//         className={"container-item " + (isRegistered ? "success" : "attention")}
//       >
//         <center>Your Registered Info</center>
//       </div>
//       <div
//         className={"container-list " + (isRegistered ? "success" : "attention")}
//       >
//         <table>
//           <tr>
//             <th>Account Address</th>
//             <td>{voter.address}</td>
//           </tr>
//           <tr>
//             <th>Name</th>
//             <td> {voter.name}</td>
//           </tr>
//           <tr>
//             <th>Phone</th>
//             <td>{voter.phone}</td>
//           </tr>
//           <tr>
//             <th>Voted</th>
//             <td>{voter.hasVoted ? "True" : "False"}</td>
//           </tr>
//           <tr>
//             <th>Verification</th>
//             <td>{voter.isVerified ? "True" : "False"}</td>
//           </tr>
//           <tr>
//             <th>Registered</th>
//             <td>{voter.isRegistered ? "True" : "False"}</td>
//           </tr>
//         </table>
//       </div>
//     </>
//   );
// }

// export function loadAllVoters(voters) {
//   const renderAllVoters = (voter) => {
//     return (
//       <>
//         <div className="container-list success">
//           <table>
//             <tr>
//               <th>Account address</th>
//               <td>{voter.address}</td>
//             </tr>
//             <tr>
//               <th>Name</th>
//               <td>{voter.name}</td>
//             </tr>
//             <tr>
//               <th>Phone</th>
//               <td>{voter.phone}</td>
//             </tr>
//             <tr>
//               <th>Voted</th>
//               <td>{voter.hasVoted ? "True" : "False"}</td>
//             </tr>
//             <tr>
//               <th>Verified</th>
//               <td>{voter.isVerified ? "True" : "False"}</td>
//             </tr>
//             <tr>
//               <th>Registered</th>
//               <td>{voter.isRegistered ? "True" : "False"}</td>
//             </tr>
//           </table>
//         </div>
//       </>
//     );
//   };
//   return (
//     <>
//       <div className="container-item success">
//         <center>List of voters</center>
//       </div>
//       {voters.map(renderAllVoters)}
//     </>
//   );
// }
