export type AcademyVideo = {
  id: string;
  title: string;
  blurb: string;
  topic: string;
};

/** Privacy embeds: youtube-nocookie.com/embed/{id} — IDs oEmbed-verified. */
export const ACADEMY_SIP_VIDEOS: AcademyVideo[] = [
  {
    id: "fsa0LabSB5c",
    topic: "How SIP & Compounding Work",
    title: "SIP Explained for Beginners",
    blurb:
      "Power of compounding, starting early vs late, and how monthly SIPs build wealth over 10–20 years.",
  },
  {
    id: "HRC8J-gVbhA",
    topic: "Step-Up SIP vs Regular SIP",
    title: "SIP vs Step-up SIP — Know the Difference",
    blurb:
      "Why raising your SIP by ~5–10% a year (with salary hikes) can dramatically grow your corpus vs a flat SIP.",
  },
  {
    id: "t6BQ1Wle8c4",
    topic: "SIP vs Lumpsum",
    title: "Lumpsum or SIP — Which Is Better?",
    blurb:
      "Market timing risk, rupee cost averaging, and when SIP vs a one-time lumpsum makes more sense.",
  },
];
