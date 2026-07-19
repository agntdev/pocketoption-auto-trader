import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getUserData } from "../storage.js";

registerMainMenuItem({ label: "📊 Status", data: "status:show", order: 30 });

const composer = new Composer<Ctx>();

function formatStatus(loggedIn: boolean, autoTrading: boolean, trades: number, wins: number, losses: number, pnl: number): string {
  const loginLabel = loggedIn ? "Connected" : "Not connected";
  const tradingLabel = autoTrading ? "Active" : "Paused";

  return [
    `Login: ${loginLabel}`,
    `Trading: ${tradingLabel}`,
    `Trades: ${trades}`,
    `Wins: ${wins} | Losses: ${losses}`,
    `P&L: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} USD`,
  ].join("\n");
}

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

composer.command("status", async (ctx) => {
  const userId = ctx.from?.id;
  const userData = userId ? await getUserData(userId) : undefined;

  const loggedIn = ctx.session.loggedIn ?? userData?.session.loginStatus === "logged_in";
  const autoTrading = ctx.session.autoTradingEnabled ?? userData?.session.autoTradingEnabled ?? false;
  const trades = ctx.session.tradesExecuted ?? userData?.session.tradesExecuted ?? 0;
  const wins = ctx.session.winCount ?? userData?.session.winCount ?? 0;
  const losses = ctx.session.lossCount ?? userData?.session.lossCount ?? 0;
  const pnl = ctx.session.pnl ?? userData?.session.pnl ?? 0;

  await ctx.reply(formatStatus(loggedIn, autoTrading, trades, wins, losses, pnl), {
    reply_markup: backToMenu,
  });
});

composer.callbackQuery("status:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  const userData = userId ? await getUserData(userId) : undefined;

  const loggedIn = ctx.session.loggedIn ?? userData?.session.loginStatus === "logged_in";
  const autoTrading = ctx.session.autoTradingEnabled ?? userData?.session.autoTradingEnabled ?? false;
  const trades = ctx.session.tradesExecuted ?? userData?.session.tradesExecuted ?? 0;
  const wins = ctx.session.winCount ?? userData?.session.winCount ?? 0;
  const losses = ctx.session.lossCount ?? userData?.session.lossCount ?? 0;
  const pnl = ctx.session.pnl ?? userData?.session.pnl ?? 0;

  await ctx.editMessageText(formatStatus(loggedIn, autoTrading, trades, wins, losses, pnl), {
    reply_markup: backToMenu,
  });
});

export default composer;
