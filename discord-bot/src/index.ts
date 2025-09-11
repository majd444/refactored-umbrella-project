import 'dotenv/config'
import { Client, GatewayIntentBits, Partials, ActivityType, Events } from 'discord.js'
import pino from 'pino'
import http from 'http'
import { fetch as undiciFetch } from 'undici'

const log = pino({ level: process.env.LOG_LEVEL || 'info' })

const agentId = process.env.AGENT_ID || 'not-set'
const appClientId = process.env.DISCORD_CLIENT_ID || 'not-set'

async function resolveToken(): Promise<string> {
  const direct = process.env.DISCORD_TOKEN
  if (direct && direct.trim().length > 0) return direct

  const convexUrl = (process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || '').replace(/\/$/, '')
  const backendKey = process.env.DISCORD_BACKEND_KEY
  if (!convexUrl || !backendKey || agentId === 'not-set') {
    log.fatal('Missing credentials. Provide DISCORD_TOKEN or set CONVEX_URL, DISCORD_BACKEND_KEY, and AGENT_ID')
    process.exit(1)
  }

  try {
    const resp = await undiciFetch(`${convexUrl}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'discord:getBotConfig', args: { agentId, key: backendKey } }),
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`Convex query failed: ${resp.status} ${resp.statusText} ${text}`)
    }
    const data: any = await resp.json()
    const tok = data?.value?.token ?? data?.token
    if (typeof tok !== 'string' || tok.length < 10) throw new Error('No token returned from Convex')
    log.info({ agentId, appClientId }, 'Fetched Discord token from Convex')
    return tok
  } catch (err) {
    log.fatal({ err }, 'Failed to fetch Discord token from Convex')
    process.exit(1)
  }
}

let tokenPromise = resolveToken()
log.info({ agentId, appClientId }, 'Starting Discord bot (token will be resolved)')

// Basic client with necessary intents. Add more if your bot needs them.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
})

client.once(Events.ClientReady, async (c) => {
  try {
    const guilds = await c.guilds.fetch()
    log.info({ tag: c.user.tag, id: c.user.id, guildCount: guilds.size, agentId }, 'Bot ready')
  } catch (e) {
    log.warn({ err: e }, 'Bot ready (failed to fetch guilds)')
  }
  c.user.setActivity({ name: `agent ${agentId}`, type: ActivityType.Listening })
})

client.on(Events.ShardDisconnect, (_, shardId) => {
  log.warn({ shardId }, 'Shard disconnected')
})

client.on(Events.Error, (err) => {
  log.error({ err }, 'Client error')
})

client.on(Events.Warn, (m) => log.warn(m))

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return
  if (interaction.commandName === 'ping') {
    await interaction.reply({ content: 'Pong! 🏓', ephemeral: true })
    return
  }
  if (interaction.commandName === 'agent') {
    const sub = interaction.options.getSubcommand()
    if (sub === 'id') {
      const agentId = process.env.AGENT_ID || 'not-set'
      await interaction.reply({ content: `Agent ID: ${agentId}`, ephemeral: true })
      return
    }
  }
})

// Optional: react to messages (for quick sanity checks)
client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot) return
  // Simple DM and guild handlers
  if (msg.content === '!ping') {
    await msg.reply('Pong! 🏓')
    return
  }
  // Respond to any DM with a basic greeting to confirm the bot is online
  if (!msg.guild) {
    await msg.reply(
      'Hi! I am online and received your DM. Try \'/ping\' or send "hello".'
    )
    return
  }
  if (msg.content.toLowerCase().includes('hello')) {
    await msg.reply('Hello! 👋')
  }
})

// Global error handlers
process.on('unhandledRejection', (reason) => {
  log.error({ reason }, 'UnhandledRejection')
})
process.on('uncaughtException', (err) => {
  log.error({ err }, 'UncaughtException')
})

;(async () => {
  const token = await tokenPromise
  client.login(token).catch((err) => {
    log.fatal({ err }, 'Failed to login to Discord')
    process.exit(1)
  })
})()

// Lightweight healthcheck HTTP server for individual bot workers.
// IMPORTANT: Do NOT bind to the platform PORT env (used by the supervisor/container).
// Use BOT_PORT if explicitly provided, otherwise 0 (random free port), to avoid EADDRINUSE when multiple bots spawn.
const port = Number(process.env.BOT_PORT ?? 0) || 0
const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true, agentId, appClientId }))
})
server.listen(port, () => {
  const addr = server.address()
  const p = typeof addr === 'object' && addr ? addr.port : port
  log.info({ port: p }, 'Healthcheck server listening')
})
