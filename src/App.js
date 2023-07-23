import React from "react";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

import Home from "./component/Home";
import Voting from "./component/Voting/Voting";
import Results from "./component/Results/Results";
import Registration from "./component/Registration/Registration";
import AddCandidate from "./component/Admin/AddCandidate/AddCandidate";
import Verification from "./component/Admin/Verification/Verification";
import test from "./component/test";
import Footer from "./component/Footer/Footer";

import "./App.css";

export default function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route exact path="/AddCandidate" component={AddCandidate} />
          <Route exact path="/Voting" component={Voting} />
          <Route exact path="/Results" component={Results} />
          <Route exact path="/Registration" component={Registration} />
          <Route exact path="/Verification" component={Verification} />
          <Route exact path="/test" component={test} />
          <Route component={NotFound} />
        </Switch>
      </Router>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <>
      <h1>404 NOT FOUND!</h1>
      <center>
        <p>
          The page you are looking for doesn't exist.
          <br />
          Go to{" "}
          <Link to="/" style={{ color: "black", textDecoration: "underline" }}>
            Home
          </Link>
        </p>
      </center>
    </>
  );
}
