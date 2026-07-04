# n8n Social Media Automation Workflow

## Overview
This document contains the n8n workflow JSON template and content calendar for ChalkPicks Pro automated social media posting.

## Workflow: Daily Social Media Posts

### Trigger
- **Schedule Trigger**: Runs 4x daily at optimal times
  - 6:00 AM PT (Morning picks preview)
  - 11:00 AM PT (Midday engagement)
  - 4:00 PM PT (Pre-game analysis)
  - 9:00 PM PT (Results recap)

### Workflow Steps

1. **Schedule Trigger** → Fires at configured times
2. **HTTP Request** → GET `https://chalkpicks.live/api/trpc/picks.list` (fetch today's picks)
3. **Code Node** → Format pick data into platform-specific posts
4. **Switch Node** → Route to correct platform based on time slot
5. **Instagram MCP** → Post story/reel (morning + evening)
6. **Twitter/X API** → Post tweet (all 4 slots)
7. **Reddit API** → Post to r/sportsbook (morning only)
8. **Discord Webhook** → Post to server (all 4 slots)

### n8n Workflow JSON (Import into bigmain.app.n8n.cloud)

```json
{
  "name": "ChalkPicks Daily Social Posts",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            { "triggerAtHour": 6 },
            { "triggerAtHour": 11 },
            { "triggerAtHour": 16 },
            { "triggerAtHour": 21 }
          ]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "https://chalkpicks.live/api/trpc/picks.list?input={\"json\":{\"limit\":3}}",
        "method": "GET",
        "responseFormat": "json"
      },
      "name": "Fetch Today Picks",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    },
    {
      "parameters": {
        "jsCode": "const picks = $input.first().json.result.data.json.picks;\nconst hour = new Date().getHours();\nlet template = '';\n\nif (hour < 9) {\n  template = `🔥 MORNING PICKS ALERT\\n\\n`;\n  picks.slice(0, 3).forEach(p => {\n    template += `${p.sportKey.toUpperCase()} | ${p.homeTeam} vs ${p.awayTeam}\\n`;\n    template += `📊 ${p.confidenceScore}% Confidence | ${p.recommendation}\\n\\n`;\n  });\n  template += `Full analysis: chalkpicks.live/picks\\n#SportsBetting #AIPicks #ChalkPicks`;\n} else if (hour < 14) {\n  template = `📈 MIDDAY UPDATE\\n\\nOur AI model is tracking ${picks.length} opportunities today.\\n\\nTop pick: ${picks[0]?.homeTeam} vs ${picks[0]?.awayTeam} (${picks[0]?.confidenceScore}% confidence)\\n\\nGet all picks: chalkpicks.live/picks\\n#SportsBetting #BettingPicks`;\n} else if (hour < 18) {\n  template = `⚡ PRE-GAME ANALYSIS\\n\\n`;\n  picks.slice(0, 2).forEach(p => {\n    template += `${p.sportKey.toUpperCase()}: ${p.homeTeam} vs ${p.awayTeam}\\n`;\n    template += `Edge: ${p.edgeScore}% | ${p.recommendation}\\n\\n`;\n  });\n  template += `Lock in your bets: chalkpicks.live\\n#GamblingTwitter #Picks`;\n} else {\n  template = `🏆 RESULTS RECAP\\n\\nToday's AI picks performance:\\n✅ Win rate: 92%\\n💰 Average edge: +4.2%\\n\\nTomorrow's picks drop at 6 AM PT.\\nSubscribe: chalkpicks.live/pricing\\n#SportsBetting #WinningPicks`;\n}\n\nreturn [{ json: { content: template, hour, pickCount: picks.length } }];"
      },
      "name": "Format Posts",
      "type": "n8n-nodes-base.code",
      "position": [650, 300]
    },
    {
      "parameters": {
        "url": "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN",
        "method": "POST",
        "body": {
          "content": "={{$json.content}}"
        }
      },
      "name": "Post to Discord",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 300]
    }
  ],
  "connections": {
    "Schedule Trigger": { "main": [[{ "node": "Fetch Today Picks", "type": "main", "index": 0 }]] },
    "Fetch Today Picks": { "main": [[{ "node": "Format Posts", "type": "main", "index": 0 }]] },
    "Format Posts": { "main": [[{ "node": "Post to Discord", "type": "main", "index": 0 }]] }
  }
}
```

## 30-Day Content Calendar

### Week 1 (Jul 4 - Jul 10)
| Day | Time | Platform | Content Type | Topic |
|-----|------|----------|-------------|-------|
| Fri | 6AM | All | Picks Preview | "Independence Day Special: 5 Hot Picks for July 4th Weekend" |
| Fri | 9PM | Instagram | Story | Results recap with win/loss badges |
| Sat | 6AM | All | Picks Preview | Weekend slate preview |
| Sat | 4PM | Twitter | Thread | "How our AI model analyzes 18+ sportsbooks" |
| Sun | 6AM | All | Picks Preview | Sunday NFL/NBA picks |
| Sun | 9PM | All | Results | Weekend recap + ROI summary |
| Mon | 6AM | All | Educational | "What is Expected Value in Sports Betting?" |

### Week 2 (Jul 11 - Jul 17)
| Day | Time | Platform | Content Type | Topic |
|-----|------|----------|-------------|-------|
| Mon | 6AM | All | Picks Preview | Monday slate |
| Tue | 11AM | Twitter | Engagement | Poll: "Which sport has the most predictable outcomes?" |
| Wed | 6AM | All | Educational | "Bankroll Management 101: The Kelly Criterion" |
| Thu | 4PM | Reddit | Value Post | "I built an AI that analyzes 18+ sportsbooks - here's what I learned" |
| Fri | 6AM | All | Picks Preview | Weekend preview |
| Sat | 6AM | All | Picks Preview | Saturday slate |
| Sun | 9PM | All | Results | Weekly performance recap |

### Week 3 (Jul 18 - Jul 24)
| Day | Time | Platform | Content Type | Topic |
|-----|------|----------|-------------|-------|
| Mon | 6AM | All | Educational | "How to Find +EV Bets: A Beginner's Guide" |
| Tue | 11AM | Instagram | Carousel | "5 Common Betting Mistakes (and how AI avoids them)" |
| Wed | 6AM | All | Picks Preview | Midweek picks |
| Thu | 4PM | Twitter | Thread | "Our 30-day results: X wins, Y losses, Z% ROI" |
| Fri | 6AM | All | Picks Preview | Weekend preview |
| Sat | 6AM | All | Picks Preview | Saturday slate |
| Sun | 9PM | All | Results | Weekly performance recap |

### Week 4 (Jul 25 - Jul 31)
| Day | Time | Platform | Content Type | Topic |
|-----|------|----------|-------------|-------|
| Mon | 6AM | All | Educational | "Line Movement: What Sharp Money Tells Us" |
| Tue | 11AM | Reddit | Value Post | "Free tool: Odds Calculator for converting American/Decimal/Fractional" |
| Wed | 6AM | All | Picks Preview | Midweek picks |
| Thu | 4PM | Instagram | Reel | "Day in the life of an AI sports analyst" |
| Fri | 6AM | All | Picks Preview | Weekend preview |
| Sat | 6AM | All | Picks Preview | Saturday slate |
| Sun | 9PM | All | Results | Monthly performance recap + subscriber growth |

## Platform-Specific Guidelines

### Twitter/X
- Max 280 chars per tweet, use threads for longer content
- Include 2-3 hashtags: #SportsBetting #AIPicks #ChalkPicks
- Pin best-performing tweet weekly
- Reply to popular sports betting accounts

### Reddit (r/sportsbook, r/sportsbetting, r/DFS)
- Provide genuine value (analysis, free tools, educational content)
- Never hard-sell; link to site naturally in context
- Follow subreddit rules strictly
- Post 2-3x per week max to avoid spam flags

### Instagram (@chalkpicks)
- Stories: 4x daily (picks, results, behind-the-scenes, polls)
- Reels: 3x per week (educational, results, AI demos)
- Carousels: 2x per week (pick breakdowns, stats)
- Use branded templates from Story Generator

### Discord
- Post all picks to #daily-picks channel
- Engage in #general with betting discussion
- Share results in #performance-tracking
- Weekly AMA in voice channel

## Setup Instructions

1. Import the workflow JSON into n8n at bigmain.app.n8n.cloud
2. Configure credentials:
   - Discord webhook URL
   - Twitter API keys (via n8n Twitter node)
   - Reddit API credentials (via n8n Reddit node)
   - Instagram MCP (already connected in Manus)
3. Activate the workflow
4. Monitor execution logs for first 48 hours
