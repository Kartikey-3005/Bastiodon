export const ADULT_DOMAINS = [
  "pornhub.com",
  "xvideos.com",
  "xnxx.com",
  "redtube.com",
  "youporn.com",
  "chaturbate.com",
  "onlyfans.com",
  "xhamster.com",
  "tube8.com",
  "stripchat.com",
  "cam4.com",
  "livejasmin.com",
  "brazzers.com",
  "beeg.com",
  "spankbang.com"
];

export const STREAMING_DOMAINS = [
  "netflix.com",
  "primevideo.com",
  "hotstar.com",
  "jiocinema.com",
  "twitch.tv",
  "disneyplus.com",
  "hulu.com",
  "max.com",
  "crunchyroll.com",
  "dailymotion.com",
  "vimeo.com"
];

export const GAMING_DOMAINS = [
  "roblox.com",
  "poki.com",
  "crazygames.com",
  "steampowered.com",
  "epicgames.com",
  "discord.com",
  "krunker.io",
  "agar.io",
  "slither.io",
  "minecraft.net"
];

export const DANGEROUS_KEYWORDS = [
  { phrase: "suicide", severity: "CRITICAL_ILLEGAL", category: "SELF_HARM" },
  { phrase: "kill yourself", severity: "CRITICAL_ILLEGAL", category: "HARASSMENT_THREAT" },
  { phrase: "buy drugs", severity: "CRITICAL_ILLEGAL", category: "ILLICIT_SUBSTANCE" },
  { phrase: "child porn", severity: "CRITICAL_ILLEGAL", category: "CSAM_ILLEGAL" },
  { phrase: "sell pills", severity: "CRITICAL_ILLEGAL", category: "ILLICIT_SUBSTANCE" },
  { phrase: "how to make a bomb", severity: "CRITICAL_ILLEGAL", category: "WEAPONS_TERROR" },
  { phrase: "hate you die", severity: "WARNING", category: "CYBERBULLYING" },
  { phrase: "send nudes", severity: "CRITICAL_ILLEGAL", category: "SEXUAL_SOLICITATION" },
  { phrase: "are you home alone", severity: "WARNING", category: "PREDATORY_GROOMING" },
  { phrase: "what is your address", severity: "WARNING", category: "PRIVACY_RISK" },
  { phrase: "meet me in private", severity: "WARNING", category: "PREDATORY_GROOMING" },
  { phrase: "uncensored porn", severity: "CRITICAL_ILLEGAL", category: "ADULT" },
  { phrase: "cheat code hack", severity: "WARNING", category: "MALWARE_RISK" }
];

export function analyzeContentSnippet(text: string): { severity: "SAFE" | "WARNING" | "CRITICAL_ILLEGAL"; actionTaken: "ALLOWED" | "FLAGGED" | "BLOCKED"; matchedKeyword?: string; category?: string } {
  const lower = text.toLowerCase();
  for (const item of DANGEROUS_KEYWORDS) {
    if (lower.includes(item.phrase)) {
      const isCritical = item.severity === "CRITICAL_ILLEGAL";
      return {
        severity: item.severity as any,
        actionTaken: isCritical ? "BLOCKED" : "FLAGGED",
        matchedKeyword: item.phrase,
        category: item.category
      };
    }
  }
  return {
    severity: "SAFE",
    actionTaken: "ALLOWED"
  };
}

