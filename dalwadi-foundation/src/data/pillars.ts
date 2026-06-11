// Default pillar content. Staff edits are saved to KV and override these at runtime.
// EDIT: confirm every partner URL below before launch.
export interface PillarLink { label: string; href: string; ghost?: boolean; }
export interface Pillar {
  key: string; name: string; eyebrow: string; title: string; body: string; links: PillarLink[];
}
export const pillars: Pillar[] = [
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
];
