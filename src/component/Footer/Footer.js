import React from "react";

import "./Footer.css";

const Footer = () => (
  <>
    <div className="footer-block"></div>
    <div className="footer">
      <div className="footer-container">
        <p>
        your vote counts: make your voice heard and shape the future{" "}
        
        </p>
        <p>
          bscscan <i className="fas fa-heartbeat" /> by{" "}
          <a
            className="profile"
            href="https://testnet.bscscan.com/address/0x862477A5c443f41F265a9a58EcED845193574BfC#readContract"
            target="_blank"
            rel="noopener noreferrer"
          >
             bscscan
          </a>
          .
        </p>
      </div>
    </div>
  </>
);

export default Footer;
