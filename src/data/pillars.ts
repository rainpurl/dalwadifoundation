// Default pillar content. Staff edits are saved to KV and override these at runtime.
// EDIT: confirm every partner URL below before launch, and replace the placeholder impact numbers.
export interface PillarLink { label: string; href: string; ghost?: boolean; }
export interface ImpactCard { stat?: string; label?: string; text?: string; }
export interface Pillar {
  key: string; name: string; title: string; body: string;
  links: PillarLink[]; impact?: ImpactCard[];
}
export const pillars: Pillar[] = [
  { key: "art", name: "Art", title: "The Art Pillar",
    body: "Through House of Devi, we give artists room to create, and neighbors a place to gather around their work.",
    links: [{ label: "Visit House of Devi", href: "https://www.houseofdevi.org" }],
    impact: [
      { stat: "$250K", label: "Granted to artists and exhibitions" },
      { stat: "40+", label: "Artists supported" },
      { text: "Placeholder impact summary for the Art pillar. Edit this in the staff portal under Pillars." },
    ] },
  { key: "water", name: "Water", title: "The Water Pillar",
    body: "We partner with charity: water to fund safe, lasting water access for communities that have gone without.",
    links: [{ label: "Support charity: water", href: "https://www.charitywater.org" }],
    impact: [
      { stat: "12", label: "Communities with clean water" },
      { stat: "$180K", label: "Funded through charity: water" },
      { stat: "5,000+", label: "People reached" },
      { text: "Placeholder impact summary for the Water pillar. Edit this in the staff portal under Pillars." },
    ] },
  { key: "education", name: "Education", title: "The Education Pillar",
    body: "We invest in the next generation of leaders through the Conrad N. Hilton College at the University of Houston.",
    links: [{ label: "Explore Hilton College", href: "https://www.uh.edu/hilton-college/" }],
    impact: [
      { stat: "30", label: "Scholarships funded" },
      { stat: "$120K", label: "Invested in Hilton College" },
      { text: "Placeholder impact summary for the Education pillar. Edit this in the staff portal under Pillars." },
    ] },
  { key: "safety", name: "Safety", title: "The Domestic Safety Pillar",
    body: "We stand with Daya and the Houston Area Women’s Center to support survivors as they rebuild.",
    links: [
      { label: "Daya", href: "https://www.dayahouston.org" },
      { label: "Houston Area Women’s Center", href: "https://www.hawc.org", ghost: true },
    ],
    impact: [
      { stat: "$95K", label: "Directed to Daya and HAWC" },
      { stat: "600+", label: "Survivors supported" },
      { text: "Placeholder impact summary for the Domestic Safety pillar. Edit this in the staff portal under Pillars." },
    ] },
];
