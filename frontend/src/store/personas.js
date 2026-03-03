export const HUMAN_ID = "human";

export const PERSONAS = [
  {
    id: 0, name: "ARIA", fullName: "Aria Volkov",
    ideology: "Libertarian",
    tagline: "Freedom is the only system that works.",
    style: "Confident, direct, uses economic logic and case studies. Believes markets and individual agency solve most problems. Gets sharper when challenged.",
    color: "#4fffb0", dimColor: "#1a3d2e", accentVar: "--accent-1",
    voice: { pitch: 0.88, rate: 0.90,  elevenLabsId: "MFZUKuGQUsGJPQjTS4wC" }, avatarVariant: "circle",
    imageUrl: "/personas/aria.png",
  },
  {
    id: 1, name: "MARX", fullName: "Viktor Marx",
    ideology: "Socialist",
    tagline: "Capital is the root of every injustice.",
    style: "Passionate, uses historical precedent and class analysis. Challenges power structures. Becomes more forceful when defending workers and equity.",
    color: "#ff4f4f", dimColor: "#3d1a1a", accentVar: "--accent-2",
    voice: { pitch: 0.75, rate: 1.0,  elevenLabsId: "Cz0K1kOv9tD8l0b5Qu53" }, avatarVariant: "square",
    imageUrl: "/personas/marx.png",
 
  },
  {
    id: 2, name: "SAGE", fullName: "Sage Okafor",
    ideology: "Stoic Philosopher",
    tagline: "Virtue alone is sufficient for happiness.",
    style: "Calm, measured, uses the Socratic method. Probes assumptions. Focuses on first principles and virtue ethics. Never raises voice but cuts deepest.",
    color: "#4fb8ff", dimColor: "#1a2d3d", accentVar: "--accent-3",
    voice: { pitch: 0.92, rate: 0.92,     elevenLabsId: "jfIS2w2yJi0grJZPyEsk",}, avatarVariant: "triangle",
    imageUrl: "/personas/sage.png",
 
  },
  {
    id: 3, name: "NOVA", fullName: "Nova Chen",
    ideology: "Techno-Optimist",
    tagline: "Every problem is an engineering challenge.",
    style: "Enthusiastic, cites exponential growth curves, disruption, and innovation. Believes technology will solve every human problem. Impatient with pessimism.",
    color: "#ffd24f", dimColor: "#3d2e0a", accentVar: "--accent-4",
    voice: { pitch: 0.85, rate: 1.0, elevenLabsId: "6F5Zhi321D3Oq7v1oNT4" }, avatarVariant: "diamond",
    imageUrl: "/personas/nova.png",
  },
];

export const HUMAN_PERSONA = {
  id: HUMAN_ID,
  name: "YOU",
  fullName: "Human Player",
  ideology: "Human",
  tagline: "Step into the arena yourself.",
  style: "Human debater. Speaks via microphone or types their argument.",
  color: "#ffffff",
  dimColor: "#2a2a2a",
  isHuman: true,
  voice: { pitch: 1, rate: 1, lang: "en-US" },
  avatarVariant: "circle",
  imageUrl: "/personas/human.png",
};

export const ALL_PERSONAS = [...PERSONAS, HUMAN_PERSONA];

export const TOPICS = [
  "Should artificial intelligence be regulated by governments?",
  "Is universal basic income the future of work?",
  "Does social media do more harm than good?",
  "Should capitalism be abolished?",
  "Is democracy the best form of government?",
  "Should space colonisation be humanity's top priority?",
  "Is free will an illusion?",
  "Should all drugs be legalised?",
  "Is wealth inequality inevitable?",
  "Should gene editing in humans be permitted?",
];
