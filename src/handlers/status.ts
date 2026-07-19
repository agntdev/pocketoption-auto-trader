import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getUserData } from "../storage.js";

const composer = new Composer<Ctx>();

function formatStatus(ctx: Ctx): string {
  const userId = ctx.from?.id;
  const userData = userId ? getUserData(userId) : undefined;

  const loggedIn = ctx.session.loggedIn ?? userData?.session.loginStatus === "logged_in";
  const autoTrading = ctx.session.autoTradingEnabled ?? userData?.session.autoTradingEnabled ?? false;
  const trades = ctx.session.tradesExecuted ?? userData?.session.tradesExecuted ?? 0;
  const wins = ctx.session.winCount ?? userData?.session.winCount ?? 0;
  const losses = ctx.session.lossCount ?? userData?.session.lossCount ?? 0;
  const pnl = ctx.session.pnl ?? userData?.session.pnl ?? 0;

  const loginLabel = loggedIn ? "Connected" : "Not connected";
  const tradingLabel = autoTrading ? "Active" : "Paused";

  const lines = [
    `Login: ${loginLabel}`,
    `Trading: ${tradingLabel}`,
    `Trades: ${trades}`,
    `Wins: ${wins} | Losses: ${losses}`,
    `P&L: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} USD`,
  ];

  return lines.join("\n");
}

composer.command("status", async (ctx) => {
  const text = formatStatus(ctx);
  await ctx.reply(text, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
