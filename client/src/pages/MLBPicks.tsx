import SportPicks, { SPORT_PICKS_CONFIGS } from "./SportPicks";

export default function MLBPicks() {
  return <SportPicks config={SPORT_PICKS_CONFIGS.mlb} />;
}
