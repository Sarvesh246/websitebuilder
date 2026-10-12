"use client";

import { useState } from "react";

/** Fictional concepts demonstrate contact controls without linking to unrelated real accounts. */
export const DemoContacts = ({ variant }: { variant: "portfolio" | "cafe" }) => {
  const [message, setMessage] = useState("");
  const labels =
    variant === "portfolio" ? ["Email me", "LinkedIn", "GitHub"] : ["Try demo order", "Call the cafe", "Email us"];
  const classes =
    variant === "portfolio"
      ? ["pf-btn", "pf-btn pf-btn--ghost", "pf-btn pf-btn--ghost"]
      : ["cafe-btn cafe-btn--light", "cafe-link cafe-link--light", "cafe-link cafe-link--light"];
  return (
    <div>
      <ul className={variant === "portfolio" ? "pf-contact__links" : "cafe-visit__actions"}>
        {labels.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              className={classes[i]}
              onClick={() =>
                setMessage(
                  variant === "portfolio"
                    ? `${label} is a concept preview. This fictional designer has no connected contact account.`
                    : "This is a fictional cafe. No order, call or message was sent.",
                )
              }
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
      <p role="status" style={{ marginTop: "1rem", fontSize: ".875rem" }}>
        {message || "Contact controls are a demo. Nothing is sent."}
      </p>
    </div>
  );
};
