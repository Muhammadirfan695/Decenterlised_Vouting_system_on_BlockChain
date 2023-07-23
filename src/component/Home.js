import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import Navbar from "./Navbar/Navigation";
import NavbarAdmin from "./Navbar/NavigationAdmin";
import UserHome from "./UserHome";
import StartEnd from "./StartEnd";
import ElectionStatus from "./ElectionStatus";
import getWeb3 from "../getWeb3";
import { address, abi } from "../contracts/Election";
import "./Home.css";

const Home = () => {
  const [ElectionInstance, setElectionInstance] = useState(undefined);
  const [account, setAccount] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [elStarted, setElStarted] = useState(false);
  const [elEnded, setElEnded] = useState(false);
  const [elDetails, setElDetails] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      if (!window.location.hash) {
        window.location = window.location + "#loaded";
        window.location.reload();
      }
      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        const networkId = await web3.eth.net.getId();
        const instance = new web3.eth.Contract(abi, address);

        setWeb3(web3);
        setElectionInstance(instance);
        setAccount(accounts[0]);

        const admin = await instance.methods.getAdmin().call();
        if (accounts[0] === admin) {
          setIsAdmin(true);
        }

        const start = await instance.methods.getStart().call();
        setElStarted(start);

        const end = await instance.methods.getEnd().call();
        setElEnded(end);

        const electionDetails = await instance.methods.getElectionDetails().call();
        setElDetails({
          adminName: electionDetails.adminName,
          adminEmail: electionDetails.adminEmail,
          adminTitle: electionDetails.adminTitle,
          electionTitle: electionDetails.electionTitle,
          organizationTitle: electionDetails.organizationTitle,
        });
      } catch (error) {
        alert("Failed to load web3, accounts, or contract. Check console for details.");
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const endElection = async () => {
    await ElectionInstance.methods
      .endElection()
      .send({ from: account, gas: 1000000 });
    window.location.reload();
  };

  const registerElection = async (data) => {
    await ElectionInstance.methods
      .setElectionDetails(
        data.adminFName.toLowerCase() + " " + data.adminLName.toLowerCase(),
        data.adminEmail.toLowerCase(),
        data.adminTitle.toLowerCase(),
        data.electionTitle.toLowerCase(),
        data.organizationTitle.toLowerCase()
      )
      .send({ from: account, gas: 1000000 });
    window.location.reload();
  };

  const EMsg = (props) => {
    return <span style={{ color: "tomato" }}>{props.msg}</span>;
  };

  const AdminHome = () => {
    const {
      handleSubmit,
      register,
      formState: { errors },
    } = useForm();

    const onSubmit = (data) => {
      registerElection(data);
    };

    return (
      <div>
        <form onSubmit={handleSubmit(onSubmit)}>
          {!elStarted && !elEnded ? (
            <div className="container-main">
              <div className="about-admin">
                <h3>Login Admin</h3>
                <div className="container-item center-items">
                  <div>
                    <label className="label-home">
                      Full Name{" "}
                      {errors.adminFName && <EMsg msg="*required" />}
                      <input
                        className="input-home"
                        type="text"
                        placeholder="First Name"
                        {...register("adminFName", {
                          required: true,
                        })}
                      />
                      <input
                        className="input-home"
                        type="text"
                        placeholder="Last Name"
                        {...register("adminLName")}
                      />
                    </label>
                    <label className="label-home">
                      Email{" "}
                      {errors.adminEmail && <EMsg msg={errors.adminEmail.message} />}
                      <input
                        className="input-home"
                        placeholder="adminemail@address.com"
                        name="adminEmail"
                        {...register("adminEmail", {
                          required: "*Required",
                          pattern: {
                            value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
                            message: "*Invalid",
                          },
                        })}
                      />
                    </label>
                    <label className="label-home">
                      Job Title or Position{" "}
                      {errors.adminTitle && <EMsg msg="*required" />}
                      <input
                        className="input-home"
                        type="text"
                        placeholder="eg. HR Head "
                        {...register("adminTitle", {
                          required: true,
                        })}
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="about-election">
                <h3>About Election</h3>
                <div className="container-item center-items">
                  <div>
                    <label className="label-home">
                      Election Title{" "}
                      {errors.electionTitle && <EMsg msg="*required" />}
                      <input
                        className="input-home"
                        type="text"
                        placeholder="eg. School Election"
                        {...register("electionTitle", {
                          required: true,
                        })}
                      />
                    </label>
                    <label className="label-home">
                      Organization Name{" "}
                      {errors.organizationName && <EMsg msg="*required" />}
                      <input
                        className="input-home"
                        type="text"
                        placeholder="eg. Lifeline Academy"
                        {...register("organizationTitle", {
                          required: true,
                        })}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <StartEnd elStarted={elStarted} elEnded={elEnded} endElFn={endElection} />
          <ElectionStatus elStarted={elStarted} elEnded={elEnded} />
        </form>
      </div>
    );
  };

  if (!web3) {
    return (
      <>
        <Navbar />
        <center>Loading Web3, accounts, and contract...</center>
      </>
    );
  }

  return (
    <>
      {isAdmin ? <NavbarAdmin /> : <Navbar />}
      <div className="container-main">
        <div className="container-item center-items info">
          Your Account: {account}
        </div>
        {!elStarted & !elEnded ? (
          <div className="container-item info">
            <center>
              <h3>The election has not been initialized.</h3>
              {isAdmin ? <p>Set up the election.</p> : <p>Please wait...</p>}
            </center>
          </div>
        ) : null}
      </div>
      {isAdmin ? (
        <>
          <AdminHome />
        </>
      ) : elStarted ? (
        <>
          <UserHome el={elDetails} />
        </>
      ) : !elStarted && elEnded ? (
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
    </>
  );
}
export default Home;