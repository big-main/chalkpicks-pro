# Vite Chalkpicks Plugin

A comprehensive Vite plugin for the Chalkpicks AI-powered sports betting platform. Provides real-time stats/picks management, data optimization, caching, HMR support, and automatic polling.

## Features

✅ **Virtual Modules** - Import stats, picks, and config as virtual modules  
✅ **Real-time HMR** - Automatic hot module replacement for data changes  
✅ **File Watching** - Monitor stats/picks directories with fs.watch  
✅ **Polling System** - Configurable polling intervals for live data updates  
✅ **Data Optimization** - Remove DB metadata and compress large datasets  
✅ **Cache Busting** - Hash-based cache validation for fresh data  
✅ **Custom Middleware** - Serve data via `/__chalkpicks_data__` endpoint  
✅ **Metadata Enrichment** - Auto-add confidence scores and timestamps to picks  
✅ **Build Optimization** - Generate metadata during production builds  
✅ **Multi-Sport Support** - NFL, NBA, MLB, NHL, MLS, NCAAB, NCAAF  

## Installation

```bash
npm install vite-chalkpicks-plugin
# or
yarn add vite-chalkpicks-plugin
```

## Configuration

### Basic Setup

```typescript
// vite.config.ts
import chalkpicksPlugin from './plugins/vite-chalkpicks-plugin'

export default {
  plugins: [
    chalkpicksPlugin({
      enableHMR: true,
      statsDir: './src/data/stats',
      picksDir: './src/data/picks',
      pollingInterval: 30000,
      optimizeBacktestData: true,
      compressData: true,
      sports: ['NFL', 'NBA', 'MLB', 'NHL'],
    }),
  ],
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableHMR` | `boolean` | `true` | Enable real-time HMR for stats/picks |
| `statsDir` | `string` | `./src/data/stats` | Directory for stats JSON files |
| `picksDir` | `string` | `./src/data/picks` | Directory for picks JSON files |
| `pollingInterval` | `number` | `30000` | Polling interval in milliseconds |
| `optimizeBacktestData` | `boolean` | `true` | Remove DB metadata from backtest data |
| `compressData` | `boolean` | `true` | Compress large datasets for transmission |
| `cacheBusting` | `'hash' \| 'timestamp'` | `'hash'` | Cache validation strategy |
| `sports` | `string[]` | `['NFL', 'NBA', 'MLB', 'NHL']` | Supported sports leagues |

## Usage

### 1. Virtual Modules

```typescript
import stats from 'virtual:chalkpicks-stats'
import picks from 'virtual:chalkpicks-picks'
import config from 'virtual:chalkpicks-config'

console.log(stats) // All stats data
console.log(picks) // All picks data
console.log(config) // Plugin configuration
```

### 2. Real-time HMR

```typescript
import { setupChalkpicksHMR } from '@/plugins/vite-chalkpicks-plugin'

setupChalkpicksHMR()

// Listen for updates
window.addEventListener('chalkpicks:stats-updated', (event: Event) => {
  const customEvent = event as CustomEvent
  console.log('Stats updated:', customEvent.detail)
})

window.addEventListener('chalkpicks:picks-updated', (event: Event) => {
  const customEvent = event as CustomEvent
  console.log('Picks updated:', customEvent.detail)
})

window.addEventListener('chalkpicks:stats-polled', (event: Event) => {
  const customEvent = event as CustomEvent
  console.log('Stats polled:', customEvent.detail)
})
```

### 3. Data Fetching via Middleware

```typescript
// Fetch stats for specific sport and date
const nflStats = await fetch(
  '/__chalkpicks_data__?type=stats&sport=NFL&date=2024-01-15'
).then(r => r.json())

// Fetch latest picks
const nbaPicksLatest = await fetch(
  '/__chalkpicks_data__?type=picks&sport=NBA'
).then(r => r.json())
```

### 4. Vue 3 Integration

```typescript
import { ref, onMounted } from 'vue'
import statsData from 'virtual:chalkpicks-stats'
import { setupChalkpicksHMR } from '@/plugins/vite-chalkpicks-plugin'

export default {
  setup() {
    const stats = ref(statsData)

    onMounted(() => {
      setupChalkpicksHMR()

      window.addEventListener('chalkpicks:stats-updated', () => {
        stats.value = { ...statsData }
      })
    })

    return { stats }
  },
}
```

### 5. React Integration

```typescript
import { useState, useEffect } from 'react'
import statsData from 'virtual:chalkpicks-stats'
import { setupChalkpicksHMR } from '@/plugins/vite-chalkpicks-plugin'

export function StatsComponent() {
  const [stats, setStats] = useState(statsData)

  useEffect(() => {
    setupChalkpicksHMR()

    const handleUpdate = () => {
      setStats({ ...statsData })
    }

    window.addEventListener('chalkpicks:stats-updated', handleUpdate)
    return () => window.removeEventListener('chalkpicks:stats-updated', handleUpdate)
  }, [])

  return <div>{JSON.stringify(stats)}</div>
}
```

## Data Directory Structure

```
src/data/
├── stats/
│   ├── NFL-2024-01-15.json
│   ├── NBA-latest.json
│   ├── MLB-2024-01-15.json
│   └── NHL-latest.json
└── picks/
    ├── NFL-2024-01-15.json
    ├── NBA-latest.json
    ├── MLB-2024-01-15.json
    └── NHL-latest.json
```

### Stats Data Format

```json
{
  "players": [
    {
      "id": "player-123",
      "name": "Player Name",
      "team": "NFL-TEAM",
      "stats": {
        "passing_yards": 300,
        "touchdowns": 2
      }
    }
  ]
}
```

### Picks Data Format

```json
{
  "picks": [
    {
      "id": "pick-123",
      "sport": "NFL",
      "pick": "Team A vs Team B",
      "confidence": 0.75,
      "reasoning": "Strong offensive line",
      "date": "2024-01-15",
      "timestamp": 1705276800000
    }
  ]
}
```

## How It Works

### Build Time
1. **Virtual Module Resolution** - Resolves `virtual:chalkpicks-*` imports
2. **Data Loading** - Reads and parses JSON files from stats/picks directories
3. **Optimization** - Removes DB metadata (`_id`, `__v`) from backtest data
4. **Compression** - Reduces numeric precision and removes empty values
5. **Bundling** - Includes data in bundle with source maps

### Dev Time
1. **File Watching** - fs.watch monitors stats/picks directories for changes
2. **Cache Invalidation** - Clears cache when files change (hash-based)
3. **HMR Triggering** - Sends custom WebSocket events to browser
4. **Module Graph Update** - Invalidates virtual modules in Vite's module graph
5. **Client Events** - Browser listens for `chalkpicks:*-updated` events

### Runtime Polling
1. **Interval Timer** - Polls directories every 30 seconds (configurable)
2. **Hash Comparison** - Compares current hash with cached hash
3. **HMR Dispatch** - Sends update event if hash differs
4. **Timestamp** - Includes update timestamp in event payload

## Performance Considerations

### Data Optimization
- **Backtest Data**: Removes `_id`, `__v`, and other metadata fields
- **Numeric Precision**: Rounds to 3 decimal places
- **Empty Values**: Strips `null`, `""`, and `undefined` from objects
- **Arrays**: Filters out empty elements

### Caching
- **Hash-based**: MD5 hash of file content (first 8 chars)
- **TTL**: No time-to-live; cache held until file changes
- **Memory**: Maps stored in plugin state; cleared on server shutdown

### Network
- **Compression**: Removes redundant data before transmission
- **Bundling**: Data included in production build (no runtime fetches)
- **Middleware**: Only loads requested files via `/__chalkpicks_data__`

## API Reference

### Virtual Modules

```typescript
// import 'virtual:chalkpicks-stats'
interface Stats {
  [filename: string]: unknown
}

// import 'virtual:chalkpicks-picks'
interface Picks {
  [filename: string]: unknown
}

// import 'virtual:chalkpicks-config'
interface Config {
  sports: string[]
  enableHMR: boolean
  optimizeBacktestData: boolean
  compressData: boolean
  pollingInterval: number
  cacheBusting: 'hash' | 'timestamp'
}
```

### HMR Events

```typescript
// Stats data updated
window.addEventListener('chalkpicks:stats-updated', (event: CustomEvent) => {
  event.detail === { file: 'NFL-2024-01-15.json', timestamp: 1705276800000 }
})

// Picks data updated
window.addEventListener('chalkpicks:picks-updated', (event: CustomEvent) => {
  event.detail === { file: 'NFL-latest.json', timestamp: 1705276800000 }
})

// Stats polled (polling interval)
window.addEventListener('chalkpicks:stats-polled', (event: CustomEvent) => {
  event.detail === { file: 'NFL-latest.json', timestamp: 1705276800000 }
})
```

### Middleware Endpoint

```typescript
GET /__chalkpicks_data__?type=stats&sport=NFL&date=2024-01-15
GET /__chalkpicks_data__?type=picks&sport=NBA
```

Query Parameters:
- `type` (required): `'stats'` or `'picks'`
- `sport` (required): Sport league code (NFL, NBA, etc.)
- `date` (optional): Specific date; defaults to latest

Response: JSON object from the requested file

## Troubleshooting

### Virtual Modules Not Resolving

**Problem**: TypeScript can't find `virtual:chalkpicks-stats`

**Solution**: Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "virtual:chalkpicks-*": ["./plugins/vite-chalkpicks-plugin.ts"]
    }
  }
}
```

### HMR Not Triggering

**Problem**: Changes to stats/picks files don't trigger updates

**Solution**: Ensure `enableHMR: true` and check browser console for WebSocket errors

### Data Not Optimizing

**Problem**: Large datasets still slow to load

**Solution**: Verify `optimizeBacktestData: true` and `compressData: true` in config

### Middleware Returning 404

**Problem**: `/__chalkpicks_data__` endpoint returns 404

**Solution**: Ensure data files exist in configured directories (defaults to `src/data/stats` and `src/data/picks`)

## Contributing

To improve this plugin:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT - See LICENSE file for details

## Support

For issues or questions:
- GitHub Issues: [chalkpicks-prov2/issues](https://github.com/big-main/chalkpicks-prov2/issues)
- Discussions: [chalkpicks-prov2/discussions](https://github.com/big-main/chalkpicks-prov2/discussions)
