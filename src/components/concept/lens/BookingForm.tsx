"use client";

import { useState } from "react";

/** Interactive concept feedback without posting visitors' details or changing the URL. */
export const BookingForm = () => {
  const [submitted, setSubmitted] = useState(false);
  return (
    <form
      className="lens-form"
      aria-label="Booking request (concept, not submitted)"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="lens-field">
        <label htmlFor="lens-name">Name</label>
        <input id="lens-name" name="name" type="text" autoComplete="off" required maxLength={100} />
      </div>
      <div className="lens-field">
        <label htmlFor="lens-date">Preferred date</label>
        <input id="lens-date" name="date" type="date" required />
      </div>
      <div className="lens-field lens-field--wide">
        <label htmlFor="lens-brief">Brief</label>
        <textarea id="lens-brief" name="brief" rows={3} required maxLength={2000} />
      </div>
      <button type="submit" className="lens-form__send">
        Try demo request
      </button>
      <p className="lens-form__note" role="status">
        {submitted ? "Demo request complete. Nothing was sent or saved." : "Concept form. Nothing is sent."}
      </p>
    </form>
  );
};
