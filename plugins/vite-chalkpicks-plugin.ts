import type { Plugin, ViteDevServer, ModuleNode } from 'vite'
import type { IncomingMessage } from 'http'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

/**
 * Virtual module names
 */
export const VIRTUAL_STATS_MODULE = 'virtual:chalkpicks-stats'
export const VIRTUAL_PICKS_MODULE = 'virtual:chalkpicks-picks'
export const VIRTUAL_CONFIG_MODULE = 'virtual:chalkpicks-config'

const VIRTUAL_STATS_ID = `\0${VIRTUAL_STATS_MODULE}`
const VIRTUAL_PICKS_ID = `\0${VIRTUAL_PICKS_MODULE}`
const VIRTUAL_CONFIG_ID = `\0${VIRTUAL_CONFIG_MODULE}`

export interface ChalkpicksPluginOptions {
  /**
   * Enable real-time HMR for stats and picks
   * @default true
   */
  enableHMR?: boolean

  /**
   * Directory containing stats data files
   * @default './src/data/stats'
   */
  statsDir?: string

  /**
   * Directory containing picks data files
   * @default './src/data/picks'
   */
  picksDir?: string

  /**
   * Enable automatic stats polling interval (ms)
   * @default 30000 (30 seconds)
   */
  pollingInterval?: number

  /**
   * Enable backtest data optimization
   * @default true
   */
  optimizeBacktestData?: boolean

  /**
   * Cache busting strategy
   * @default 'hash'
   */
  cacheBusting?: 'hash' | 'timestamp'

  /**
   * Compression for large datasets
   * @default true
   */
  compressData?: boolean

  /**
   * Sports to include
   * @default ['NFL', 'NBA', 'MLB', 'NHL']
   */
  sports?: string[]
}

interface CachedStats {
  data: Record<string, unknown>
  hash: string
  timestamp: number
}

interface CachedPicks {
  data: Record<string, unknown>
  hash: string
  timestamp: number
}

class ChalkpicksPluginState {
  private statsCache = new Map<string, CachedStats>()
  private picksCache = new Map<string, CachedPicks>()
  private watchers = new Map<string, fs.FSWatcher>()
  private pollingIntervals = new Map<string, NodeJS.Timeout>()
  private fileHashes = new Map<string, string>()

  getStatsCache(key: string) {
    return this.statsCache.get(key)
  }

  setStatsCache(key: string, value: CachedStats) {
    this.statsCache.set(key, value)
  }

  getPicksCache(key: string) {
    return this.picksCache.get(key)
  }

  setPicksCache(key: string, value: CachedPicks) {
    this.picksCache.set(key, value)
  }

  getFileHash(filePath: string) {
    return this.fileHashes.get(filePath)
  }

  setFileHash(filePath: string, hash: string) {
    this.fileHashes.set(filePath, hash)
  }

  addWatcher(key: string, watcher: fs.FSWatcher) {
    const existing = this.watchers.get(key)
    if (existing) existing.close()
    this.watchers.set(key, watcher)
  }

  getWatcher(key: string) {
    return this.watchers.get(key)
  }

  addPollingInterval(key: string, interval: NodeJS.Timeout) {
    const existing = this.pollingIntervals.get(key)
    if (existing) clearInterval(existing)
    this.pollingIntervals.set(key, interval)
  }

  clearAll() {
    this.watchers.forEach(w => w.close())
    this.pollingIntervals.forEach(i => clearInterval(i))
    this.statsCache.clear()
    this.picksCache.clear()
    this.fileHashes.clear()
    this.watchers.clear()
    this.pollingIntervals.clear()
  }
}

/**
 * Generate hash of file content
 */
function generateFileHash(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return crypto.createHash('md5').update(content).digest('hex').slice(0, 8)
  } catch {
    return crypto.randomBytes(4).toString('hex')
  }
}

/**
 * Load and cache stats data with optimization
 */
function loadStatsData(
  filePath: string,
  options: ChalkpicksPluginOptions,
  state: ChalkpicksPluginState
): string {
  const cached = state.getStatsCache(filePath)
  const currentHash = generateFileHash(filePath)

  // Return cached version if hash matches
  if (cached && cached.hash === currentHash) {
    return `export default ${JSON.stringify(cached.data)}`
  }

  try {
    let rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    // Optimize backtest data
    if (options.optimizeBacktestData) {
      rawData = optimizeBacktestData(rawData)
    }

    // Compress if needed
    if (options.compressData) {
      rawData = compressDataForTransmission(rawData)
    }

    const cacheEntry: CachedStats = {
      data: rawData,
      hash: currentHash,
      timestamp: Date.now(),
    }

    state.setStatsCache(filePath, cacheEntry)
    return `export default ${JSON.stringify(rawData)}`
  } catch (error) {
    console.error(`Failed to load stats from ${filePath}:`, error)
    return `export default {}`
  }
}

/**
 * Load and cache picks data
 */
function loadPicksData(
  filePath: string,
  options: ChalkpicksPluginOptions,
  state: ChalkpicksPluginState
): string {
  const cached = state.getPicksCache(filePath)
  const currentHash = generateFileHash(filePath)

  if (cached && cached.hash === currentHash) {
    return `export default ${JSON.stringify(cached.data)}`
  }

  try {
    let rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    // Add confidence metadata
    rawData = enrichPicksWithMetadata(rawData)

    const cacheEntry: CachedPicks = {
      data: rawData,
      hash: currentHash,
      timestamp: Date.now(),
    }

    state.setPicksCache(filePath, cacheEntry)
    return `export default ${JSON.stringify(rawData)}`
  } catch (error) {
    console.error(`Failed to load picks from ${filePath}:`, error)
    return `export default {}`
  }
}

/**
 * Optimize backtest data by removing redundant fields
 */
function optimizeBacktestData(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'object' && item !== null) {
        const { _id, __v, ...optimized } = item as Record<string, unknown>
        return optimized
      }
      return item
    })
  }
  if (typeof data === 'object' && data !== null) {
    const { _id, __v, ...optimized } = data as Record<string, unknown>
    return optimized
  }
  return data
}

/**
 * Compress data by reducing precision and removing empty values
 */
function compressDataForTransmission(data: unknown): unknown {
  if (typeof data === 'number') {
    return Math.round(data * 1000) / 1000
  }
  if (Array.isArray(data)) {
    return data.map(compressDataForTransmission).filter(item => item !== null && item !== '')
  }
  if (typeof data === 'object' && data !== null) {
    const compressed: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const compressedValue = compressDataForTransmission(value)
      if (compressedValue !== null && compressedValue !== '') {
        compressed[key] = compressedValue
      }
    }
    return compressed
  }
  return data
}

/**
 * Enrich picks with metadata like confidence scores and timestamps
 */
function enrichPicksWithMetadata(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(pick => {
      if (typeof pick === 'object' && pick !== null) {
        const enriched = { ...pick } as Record<string, unknown>
        if (!enriched.confidence) {
          enriched.confidence = 0.5
        }
        if (!enriched.timestamp) {
          enriched.timestamp = Date.now()
        }
        return enriched
      }
      return pick
    })
  }
  return data
}

/**
 * Setup file watchers for HMR
 */
function setupFileWatchers(
  server: ViteDevServer,
  options: ChalkpicksPluginOptions,
  state: ChalkpicksPluginState
): void {
  if (!options.enableHMR) return

  const statsDir = options.statsDir || './src/data/stats'
  const picksDir = options.picksDir || './src/data/picks'

  // Watch stats directory
  if (fs.existsSync(statsDir)) {
    const statsWatcher = fs.watch(statsDir, (eventType, filename) => {
      if (filename && (filename.endsWith('.json') || filename.endsWith('.ts'))) {
        const filePath = path.join(statsDir, filename)
        state.statsCache.delete(filePath)

        // Trigger HMR update
        const module = server.moduleGraph.getModuleById(VIRTUAL_STATS_ID)
        if (module) {
          server.moduleGraph.invalidateModule(module)
          server.ws.send({
            type: 'custom',
            event: 'chalkpicks:stats-updated',
            data: { file: filename, timestamp: Date.now() },
          })
        }
      }
    })
    state.addWatcher('stats', statsWatcher)
  }

  // Watch picks directory
  if (fs.existsSync(picksDir)) {
    const picksWatcher = fs.watch(picksDir, (eventType, filename) => {
      if (filename && (filename.endsWith('.json') || filename.endsWith('.ts'))) {
        const filePath = path.join(picksDir, filename)
        state.picksCache.delete(filePath)

        const module = server.moduleGraph.getModuleById(VIRTUAL_PICKS_ID)
        if (module) {
          server.moduleGraph.invalidateModule(module)
          server.ws.send({
            type: 'custom',
            event: 'chalkpicks:picks-updated',
            data: { file: filename, timestamp: Date.now() },
          })
        }
      }
    })
    state.addWatcher('picks', picksWatcher)
  }
}

/**
 * Setup polling for real-time stats
 */
function setupStatsPolling(
  server: ViteDevServer,
  options: ChalkpicksPluginOptions,
  state: ChalkpicksPluginState
): void {
  const interval = options.pollingInterval || 30000

  const pollInterval = setInterval(() => {
    const statsDir = options.statsDir || './src/data/stats'
    if (!fs.existsSync(statsDir)) return

    try {
      const files = fs.readdirSync(statsDir)
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(statsDir, file)
          const currentHash = generateFileHash(filePath)
          const cachedHash = state.getFileHash(filePath)

          if (cachedHash && cachedHash !== currentHash) {
            // File changed, invalidate cache
            state.statsCache.delete(filePath)
            state.setFileHash(filePath, currentHash)

            // Send HMR update
            const module = server.moduleGraph.getModuleById(VIRTUAL_STATS_ID)
            if (module) {
              server.moduleGraph.invalidateModule(module)
              server.ws.send({
                type: 'custom',
                event: 'chalkpicks:stats-polled',
                data: { file, timestamp: Date.now() },
              })
            }
          } else if (!cachedHash) {
            state.setFileHash(filePath, currentHash)
          }
        }
      })
    } catch (error) {
      console.error('Error during stats polling:', error)
    }
  }, interval)

  state.addPollingInterval('stats', pollInterval)
}

/**
 * Generate config module
 */
function generateConfigModule(options: ChalkpicksPluginOptions): string {
  const config = {
    sports: options.sports || ['NFL', 'NBA', 'MLB', 'NHL'],
    enableHMR: options.enableHMR !== false,
    optimizeBacktestData: options.optimizeBacktestData !== false,
    compressData: options.compressData !== false,
    pollingInterval: options.pollingInterval || 30000,
    cacheBusting: options.cacheBusting || 'hash',
  }

  return `export default ${JSON.stringify(config, null, 2)}`
}

/**
 * Main Vite Plugin
 */
export function chalkpicksPlugin(options: ChalkpicksPluginOptions = {}): Plugin {
  const state = new ChalkpicksPluginState()
  let server: ViteDevServer

  const statsDir = options.statsDir || './src/data/stats'
  const picksDir = options.picksDir || './src/data/picks'

  return {
    name: 'vite-chalkpicks-plugin',
    apply: 'serve',

    configResolved(config) {
      // Ensure directories exist
      ;[statsDir, picksDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }
      })
    },

    configureServer(devServer) {
      server = devServer

      // Setup file watchers and polling
      setupFileWatchers(devServer, options, state)
      setupStatsPolling(devServer, options, state)

      return () => {
        // Middleware for serving attachment-style data
        devServer.middlewares.use('/__chalkpicks_data__', (req, res, next) => {
          try {
            const url = new URL(req.url || '', 'http://localhost')
            const dataType = url.searchParams.get('type') // 'stats' or 'picks'
            const sport = url.searchParams.get('sport')
            const date = url.searchParams.get('date')

            if (!dataType || !sport) {
              return next()
            }

            const fileName = `${sport}-${date || 'latest'}.json`
            const filePath =
              dataType === 'picks'
                ? path.join(picksDir, fileName)
                : path.join(statsDir, fileName)

            if (!fs.existsSync(filePath)) {
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'Data not found' }))
              return
            }

            const data =
              dataType === 'picks'
                ? loadPicksData(filePath, options, state)
                : loadStatsData(filePath, options, state)

            res.setHeader('Content-Type', 'application/json')
            res.end(data)
          } catch (error) {
            console.error('Error in data middleware:', error)
            next(error)
          }
        })
      }
    },

    resolveId(id) {
      if (id === VIRTUAL_STATS_MODULE) return VIRTUAL_STATS_ID
      if (id === VIRTUAL_PICKS_MODULE) return VIRTUAL_PICKS_ID
      if (id === VIRTUAL_CONFIG_MODULE) return VIRTUAL_CONFIG_ID
    },

    load(id) {
      if (id === VIRTUAL_STATS_ID) {
        try {
          const statsDir_ = options.statsDir || './src/data/stats'
          if (!fs.existsSync(statsDir_)) return `export default {}`

          const files = fs.readdirSync(statsDir_).filter(f => f.endsWith('.json'))
          const allStats: Record<string, unknown> = {}

          files.forEach(file => {
            const filePath = path.join(statsDir_, file)
            const key = file.replace('.json', '')
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            allStats[key] = options.optimizeBacktestData ? optimizeBacktestData(data) : data
          })

          return `export default ${JSON.stringify(allStats)}`
        } catch (error) {
          console.error('Error loading virtual stats module:', error)
          return `export default {}`
        }
      }

      if (id === VIRTUAL_PICKS_ID) {
        try {
          const picksDir_ = options.picksDir || './src/data/picks'
          if (!fs.existsSync(picksDir_)) return `export default {}`

          const files = fs.readdirSync(picksDir_).filter(f => f.endsWith('.json'))
          const allPicks: Record<string, unknown> = {}

          files.forEach(file => {
            const filePath = path.join(picksDir_, file)
            const key = file.replace('.json', '')
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            allPicks[key] = enrichPicksWithMetadata(data)
          })

          return `export default ${JSON.stringify(allPicks)}`
        } catch (error) {
          console.error('Error loading virtual picks module:', error)
          return `export default {}`
        }
      }

      if (id === VIRTUAL_CONFIG_ID) {
        return generateConfigModule(options)
      }
    },

    async handleHotUpdate({ file, server, modules }) {
      // Clear caches for stats and picks files
      if (
        (statsDir && file.startsWith(statsDir)) ||
        (picksDir && file.startsWith(picksDir))
      ) {
        state.statsCache.delete(file)
        state.picksCache.delete(file)

        const isStats = statsDir && file.startsWith(statsDir)
        const virtualModule = server.moduleGraph.getModuleById(
          isStats ? VIRTUAL_STATS_ID : VIRTUAL_PICKS_ID
        )

        if (virtualModule) {
          server.moduleGraph.invalidateModule(virtualModule)

          server.ws.send({
            type: 'custom',
            event: isStats ? 'chalkpicks:stats-updated' : 'chalkpicks:picks-updated',
            data: {
              file: path.basename(file),
              timestamp: Date.now(),
            },
          })
        }
      }
    },

    apply: 'build',
    async generateBundle(output, bundle) {
      // Generate metadata file during build
      const metadata = {
        generated: new Date().toISOString(),
        sports: options.sports || ['NFL', 'NBA', 'MLB', 'NHL'],
        statsDir,
        picksDir,
        optimizations: {
          backtestOptimized: options.optimizeBacktestData !== false,
          dataCompressed: options.compressData !== false,
        },
      }

      bundle['chalkpicks-metadata.json'] = {
        type: 'asset',
        fileName: 'chalkpicks-metadata.json',
        source: JSON.stringify(metadata, null, 2),
      }
    },
  }
}

/**
 * Client-side HMR listener hook
 */
export function setupChalkpicksHMR() {
  if (import.meta.hot) {
    import.meta.hot.on('chalkpicks:stats-updated', (data: Record<string, unknown>) => {
      console.log('[Chalkpicks] Stats updated:', data)
      window.dispatchEvent(
        new CustomEvent('chalkpicks:stats-updated', { detail: data })
      )
    })

    import.meta.hot.on('chalkpicks:picks-updated', (data: Record<string, unknown>) => {
      console.log('[Chalkpicks] Picks updated:', data)
      window.dispatchEvent(
        new CustomEvent('chalkpicks:picks-updated', { detail: data })
      )
    })

    import.meta.hot.on('chalkpicks:stats-polled', (data: Record<string, unknown>) => {
      console.log('[Chalkpicks] Stats polled:', data)
      window.dispatchEvent(
        new CustomEvent('chalkpicks:stats-polled', { detail: data })
      )
    })
  }
}

export default chalkpicksPlugin
