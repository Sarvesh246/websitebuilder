"use client";

import { useRef, useState, type KeyboardEvent } from "react";

type Slot = { time: string; act: string; note: string; tag: string };
type Day = { id: string; short: string; long: string; date: string; slots: Slot[] };

const days: Day[] = [
  {
    id: "fri",
    short: "Fri",
    long: "Friday",
    date: "Apr 17",
    slots: [
      { time: "6:00", act: "Doors open", note: "Wristbands, coat check, first lights", tag: "Doors" },
      { time: "6:45", act: "Open mic: first call", note: "Eight members, five minutes each", tag: "Live" },
      { time: "8:00", act: "The Lowlight Kids", note: "Garage pop from the east dorms", tag: "Headline" },
      { time: "9:30", act: "DJ Marrow", note: "Late set until the building closes", tag: "Dance" },
    ],
  },
  {
    id: "sat",
    short: "Sat",
    long: "Saturday",
    date: "Apr 18",
    slots: [
      { time: "1:00", act: "Zine and print market", note: "Posters, tapes and stickers made by members", tag: "Market" },
      { time: "3:00", act: "Mural jam", note: "Bring a marker, leave your mark on the wall", tag: "Make" },
      { time: "7:00", act: "Nova Static", note: "Synths, drums, and one very loud violin", tag: "Headline" },
      { time: "9:00", act: "Choir Riot", note: "Forty voices, no microphones", tag: "Live" },
    ],
  },
  {
    id: "sun",
    short: "Sun",
    long: "Sunday",
    date: "Apr 19",
    slots: [
      { time: "12:00", act: "Brunch and critique", note: "Friendly feedback on member demos", tag: "Chill" },
      { time: "2:00", act: "Panel: starting a scene", note: "Members talk booking, posters and nerves", tag: "Talk" },
      { time: "5:00", act: "Surge closing set", note: "Everyone on stage, one last song", tag: "Finale" },
    ],
  },
];

export const Schedule = () => {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (to: number) => {
    const next = (to + days.length) % days.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowRight") move(active + 1);
    else if (e.key === "ArrowLeft") move(active - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(days.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div className="org-sched">
      <div role="tablist" aria-label="Showcase days" className="org-sched__tabs">
        {days.map((d, i) => (
          <button
            key={d.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`org-tab-${d.id}`}
            aria-selected={active === i}
            aria-controls={`org-panel-${d.id}`}
            tabIndex={active === i ? 0 : -1}
            className="org-sched__tab"
            onClick={() => setActive(i)}
            onKeyDown={onKey}
          >
            <span className="org-sched__tabname">{d.short}</span>
            <span className="org-sched__tabdate">{d.date}</span>
          </button>
        ))}
      </div>
      {days.map((d, i) => (
        <div
          key={d.id}
          role="tabpanel"
          id={`org-panel-${d.id}`}
          aria-labelledby={`org-tab-${d.id}`}
          hidden={active !== i}
          className="org-sched__panel"
        >
          <p className="org-sched__day">
            {d.long}, {d.date}
          </p>
          <ol className="org-sched__list">
            {d.slots.map((s) => (
              <li key={s.time + s.act} className="org-slot">
                <span className="org-slot__time">
                  {s.time}
                  <small>PM</small>
                </span>
                <span className="org-slot__main">
                  <span className="org-slot__act">{s.act}</span>
                  <span className="org-slot__note">{s.note}</span>
                </span>
                <span className="org-slot__tag">{s.tag}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
};
