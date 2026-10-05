"use client";

import { useRef, useState, type KeyboardEvent } from "react";

type Item = { name: string; desc: string; price: string };
type Group = { id: string; label: string; note: string; items: Item[] };

const MENU: Group[] = [
  {
    id: "coffee",
    label: "Coffee",
    note: "Roasted in small batches, poured to order.",
    items: [
      { name: "Pour-over", desc: "Single origin, rotating weekly", price: "5.00" },
      { name: "Flat white", desc: "Double ristretto, silky steamed milk", price: "4.50" },
      { name: "Honey cardamom latte", desc: "Local honey, a pinch of cardamom", price: "5.25" },
      { name: "Cortado", desc: "Equal parts espresso and warm milk", price: "4.00" },
      { name: "Cold brew", desc: "Steeped overnight, served over ice", price: "4.75" },
      { name: "Hot chocolate", desc: "Dark chocolate, whole milk, sea salt", price: "4.50" },
    ],
  },
  {
    id: "bakery",
    label: "Bakery",
    note: "Baked before we open, gone when it is gone.",
    items: [
      { name: "Butter croissant", desc: "Laminated for three days", price: "3.75" },
      { name: "Seasonal fruit tart", desc: "Almond cream, whatever is ripe", price: "5.50" },
      { name: "Country sourdough", desc: "Long ferment, crackling crust", price: "8.00" },
      { name: "Cardamom bun", desc: "Sticky, spiced, pearl sugar", price: "4.25" },
      { name: "Brown butter cookie", desc: "Chewy centre, flaky salt", price: "3.00" },
      { name: "Lemon olive oil cake", desc: "Slice, served with crème fraîche", price: "4.75" },
    ],
  },
  {
    id: "brunch",
    label: "Brunch",
    note: "Weekends until 2pm, weekdays until 11.",
    items: [
      { name: "Soft scramble toast", desc: "Chives, whipped butter, sourdough", price: "10.50" },
      { name: "Avocado and radish", desc: "Seeded rye, lemon, chilli flake", price: "11.00" },
      { name: "Ricotta pancakes", desc: "Stone fruit, maple, toasted hazelnut", price: "12.00" },
      { name: "Breakfast sandwich", desc: "Fried egg, cheddar, tomato jam, brioche", price: "9.50" },
      { name: "Market salad", desc: "Seasonal greens, herbs, sherry vinaigrette", price: "10.00" },
      { name: "Yoghurt bowl", desc: "Honey, granola, poached fruit", price: "8.50" },
    ],
  },
];

export const MenuTabs = () => {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (to: number) => {
    const next = (to + MENU.length) % MENU.length;
    setActive(next);
    refs.current[next]?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") move(active + 1);
    else if (e.key === "ArrowLeft") move(active - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(MENU.length - 1);
    else return;
    e.preventDefault();
  };

  const group = MENU[active];

  return (
    <div className="cafe-menu">
      <div className="cafe-tabs" role="tablist" aria-label="Menu categories" onKeyDown={onKey}>
        {MENU.map((g, i) => (
          <button
            key={g.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${g.id}`}
            aria-selected={i === active}
            aria-controls={`panel-${g.id}`}
            tabIndex={i === active ? 0 : -1}
            className="cafe-tab"
            onClick={() => setActive(i)}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div key={group.id} role="tabpanel" id={`panel-${group.id}`} aria-labelledby={`tab-${group.id}`} className="cafe-panel" tabIndex={0}>
        <p className="cafe-panel__note">{group.note}</p>
        <ul className="cafe-items">
          {group.items.map((it) => (
            <li key={it.name} className="cafe-item">
              <div className="cafe-item__row">
                <span className="cafe-item__name">{it.name}</span>
                <span className="cafe-item__dots" aria-hidden />
                <span className="cafe-item__price">
                  <span className="cafe-sr">$</span>
                  {it.price}
                </span>
              </div>
              <p className="cafe-item__desc">{it.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
