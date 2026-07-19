# PocketOption Auto-Trader — Bot specification

**Archetype:** workflow

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

Telegram bot that automates PocketOption trading using real-time external signals. Collects user credentials, account settings, and trade parameters, then executes trades automatically with live notifications and command-based control.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Retail PocketOption traders
- Automated trading enthusiasts

## Success criteria

- User receives login confirmation after setup
- Trades are executed and reported in real-time
- Commands like /stop and /status return current session data

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open onboarding flow for new users
- **Get Started 🚀** (button, actor: user, callback: onboarding:start) — Initiates credential collection flow
- **/stop** (command, actor: user, command: /stop) — Disables auto-trading for current session
- **/status** (command, actor: user, command: /status) — Displays current trading session statistics

## Flows

### onboarding
_Trigger:_ /start

1. Show welcome message with 'Get Started' button
2. Collect PocketOption email
3. Collect PocketOption password
4. Request account type selection (Real/Demo)
5. Request trade amount (USD)
6. Request timeframe selection (1m/5m/30m/1h)
7. Display login status animation
8. Confirm login success or prompt retry

_Data touched:_ user_profile, credentials, trade_settings

### trade_execution
_Trigger:_ external_signal_received

1. Validate signal against user timeframe
2. Execute trade via PocketOption API
3. Send trade confirmation notification
4. Update session statistics

_Data touched:_ trading_session, external_signals

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **user_profile** _(retention: persistent)_ — Telegram user identity and notification preferences
  - fields: telegram_user_id, chat_id
- **credentials** _(retention: persistent)_ — PocketOption account access details
  - fields: email, encrypted_password
- **trade_settings** _(retention: persistent)_ — User-defined trading parameters
  - fields: account_type, trade_amount, timeframe
- **trading_session** _(retention: session)_ — Active session state and performance metrics
  - fields: login_status, auto_trading_enabled, trades_executed, win_count, loss_count, pnl
- **external_signals** _(retention: session)_ — Real-time trade signals from provider
  - fields: signal_timestamp, action, instrument, confidence_level

## Integrations

- **Telegram** (required) — Bot API messaging and notifications
- **PocketOption API** (required) — User authentication and trade execution
- **External Signal Provider** (required) — Real-time trade signals
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Configure signal provider API endpoint
- Set encryption key for credential storage
- Define rate limits for PocketOption API requests

## Notifications

- Login success/failure status
- Trade execution confirmation (timestamp, action, outcome)
- Session statistics summary on /status
- Auto-trading pause/resume notifications

## Permissions & privacy

- Secure credential storage with encryption at rest
- All notifications sent only to initiating chat
- No third-party data sharing
- User must explicitly initiate setup flow

## Edge cases

- Invalid PocketOption credentials during login
- Signal provider API downtime
- User enters non-numeric trade amount
- Multiple concurrent login attempts

## Required tests

- End-to-end onboarding flow with mock PocketOption API
- Signal processing with invalid timeframe mismatch
- Trade execution with insufficient account balance
- Command handling during active trading session

## Assumptions

- Signal provider maintains consistent API format
- PocketOption API rate limits are not exceeded
- Users understand risks of automated trading
