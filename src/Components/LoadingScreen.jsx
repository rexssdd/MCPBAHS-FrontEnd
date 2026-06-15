import React from "react";
import logo from "../assets/school-logo.png"; 
import "../Css/LoadingScreen.css";

export default function LoadingScreen() {
  return (
    <div className="loading-root">
      <div className="logo-wrap">
        <img src={logo} alt="School Logo" className="logo-img" />
        <div className="progress-track">
          <div className="progress-bar" />
        </div>
      </div>
    </div>
  );
}