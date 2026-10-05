"use client";

import { useState } from "react";

const DAYS = ["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16"];
const TIMES = ["9:30 am", "11:00 am", "1:30 pm", "3:00 pm", "4:30 pm"];

export const BookCall = () => {
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  const reset = () => {
    setDay(null);
    setTime(null);
    setBooked(false);
  };

  return (
    <div className="fl-book">
      <div className="fl-book__head">
        <p className="fl-book__title">Pick a time for a 20 minute intro call</p>
        <p className="fl-book__hint">Concept widget only. Nothing is sent anywhere.</p>
      </div>

      {booked ? (
        <div className="fl-book__done" role="status">
          <p className="fl-book__donetext">
            You are on the calendar: {day} at {time}. Juno will bring the questions, you bring the mess.
          </p>
          <button type="button" className="fl-pill fl-pill--ghost" onClick={reset}>
            Pick another time
          </button>
        </div>
      ) : (
        <>
          <fieldset className="fl-book__group">
            <legend>Day</legend>
            <div className="fl-chips">
              {DAYS.map((d) => (
                <button key={d} type="button" className="fl-chip" aria-pressed={day === d} onClick={() => setDay(d)}>
                  {d}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="fl-book__group">
            <legend>Time</legend>
            <div className="fl-chips">
              {TIMES.map((t) => (
                <button key={t} type="button" className="fl-chip" aria-pressed={time === t} onClick={() => setTime(t)}>
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="fl-book__foot">
            <button type="button" className="fl-pill fl-pill--ink" disabled={!day || !time} onClick={() => setBooked(true)}>
              Book the call
            </button>
            <p className="fl-book__status" aria-live="polite">
              {day && time ? `${day} at ${time}` : "Choose a day and a time"}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
