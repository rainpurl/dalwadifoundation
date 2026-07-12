// Default site content. Staff edits (About / Contribute) are saved to KV and override these.
export const site = {
  name: "Dalwadi Foundation",
  about: {
    kicker: "About",
    title: "A foundation, and four pillars.",
    lede: "Dalwadi Foundation supports the people and places that make a community whole, through art, water, education, and safety.",
    body: [
      "We don’t work alone. We back organizations already doing the work on the ground, and we help them do more of it.",
      "Each pillar is a long-term commitment, not a one-time gift: a partnership we grow alongside the people closest to the need.",
    ],
  },
  team: [
    { name: "Lorem Ipsum", title: "Founder & President", photo: "", bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
    { name: "Dolor Sit", title: "Executive Director", photo: "", bio: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." },
    { name: "Amet Consectetur", title: "Director of Programs", photo: "", bio: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur." },
  ],
  contribute: {
    kicker: "Support",
    title: "Every gift moves all four.",
    lede: "A single contribution strengthens art, water, education, and safety together.",
    body: [
      "Give once, or reach out to talk about partnering with the foundation directly.",
      "However you give, your support is shared across all four pillars and the partners behind them.",
    ],
    donateUrl: "#",            // EDIT: real donation link
    email: "hello@dalwadi.org", // EDIT: real contact address
  },
};
