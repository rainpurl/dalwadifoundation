// API fallback content + the immutable owner. Keep in sync with src/data/*.
export const OWNER = "pjbrahm369@gmail.com";

export const DEFAULT_CONTENT = {
  settings: {
    font: { label: "Literata", family: "Literata", stack: '"Literata", Georgia, serif' },
  },
  pillars: [
    { key: "art", name: "Art", eyebrow: "Community & Art", title: "The Art Pillar",
      body: "Through House of Devi, we give artists room to create — and neighbors a place to gather around their work.",
      links: [{ label: "Visit House of Devi", href: "https://www.houseofdevi.org" }] },
    { key: "water", name: "Water", eyebrow: "Water Access", title: "The Water Pillar",
      body: "We partner with charity: water to fund safe, lasting water access for communities that have gone without.",
      links: [{ label: "Support charity: water", href: "https://www.charitywater.org" }] },
    { key: "education", name: "Education", eyebrow: "Education", title: "The Education Pillar",
      body: "We invest in the next generation of leaders through the Conrad N. Hilton College at the University of Houston.",
      links: [{ label: "Explore Hilton College", href: "https://www.uh.edu/hilton-college/" }] },
    { key: "safety", name: "Safety", eyebrow: "Domestic Safety", title: "The Domestic Safety Pillar",
      body: "We stand with Daya and the Houston Area Women’s Center to support survivors as they rebuild.",
      links: [
        { label: "Daya", href: "https://www.dayahouston.org" },
        { label: "Houston Area Women’s Center", href: "https://www.hawc.org", ghost: true },
      ] },
  ],
  about: {
    kicker: "About",
    title: "A foundation, and four pillars.",
    lede: "The Dalwadi Foundation supports the people and places that make a community whole — through art, water, education, and safety.",
    body: [
      "We don’t work alone. We back organizations already doing the work on the ground, and we help them do more of it.",
      "Each pillar is a long-term commitment, not a one-time gift: a partnership we grow alongside the people closest to the need.",
    ],
  },
  contribute: {
    kicker: "Support",
    title: "Every gift moves all four.",
    lede: "A single contribution strengthens art, water, education, and safety together.",
    body: [
      "Give once, or reach out to talk about partnering with the foundation directly.",
      "However you give, your support is shared across all four pillars and the partners behind them.",
    ],
    donateUrl: "#",
    email: "hello@dalwadi.org",
  },
};
