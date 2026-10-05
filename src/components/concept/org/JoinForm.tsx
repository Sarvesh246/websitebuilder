"use client";

import { useState, type FormEvent } from "react";

const roles = ["Volunteer", "Perform", "Design"] as const;

export const JoinForm = () => {
  const [role, setRole] = useState<(typeof roles)[number]>("Perform");
  const [done, setDone] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setDone(true);
  };

  return (
    <form className="org-form" onSubmit={onSubmit} aria-labelledby="org-form-title">
      <h3 id="org-form-title" className="org-form__title">
        Join the collective
      </h3>
      <label className="org-field">
        <span>Name</span>
        <input type="text" name="name" autoComplete="name" placeholder="Your name" required />
      </label>
      <label className="org-field">
        <span>Campus email</span>
        <input type="email" name="email" autoComplete="email" placeholder="you@example.edu" required />
      </label>
      <fieldset className="org-roles">
        <legend>I want to</legend>
        <div className="org-roles__row">
          {roles.map((r) => (
            <label key={r} className="org-role">
              <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} />
              <span>{r}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button type="submit" className="org-btn org-btn--green">
        Join the club
      </button>
      <p className="org-form__note" role="status">
        {done ? "Demo form: nothing was sent. On a live site this would reach the club inbox." : "Demo form for this concept. It does not send anything."}
      </p>
    </form>
  );
};
