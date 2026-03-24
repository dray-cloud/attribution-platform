"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginButton() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn("hubspot", { callbackUrl: "/" });
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      style={{
        width: "100%",
        padding: "13px 0",
        borderRadius: 12,
        border: "none",
        background: loading ? "#aaa" : "#FF7A59",
        color: "#fff",
        fontSize: 15,
        fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        transition: "background 0.15s",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="white" fillOpacity="0.2"/>
        <text x="20" y="27" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">H</text>
      </svg>
      {loading ? "Redirecting…" : "Sign in with HubSpot"}
    </button>
  );
}
