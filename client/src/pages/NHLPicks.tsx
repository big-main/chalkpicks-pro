import SportPicks, { SPORT_PICKS_CONFIGS } from "./SportPicks";

export default function NHLPicks() {
  return <SportPicks config={SPORT_PICKS_CONFIGS.nhl} />;
}
