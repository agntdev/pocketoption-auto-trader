import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getUserData, saveUserData } from "../storage.js";
import {
  executeTrade,
  type PocketOptionTradeRequest,
} from "../pocket-option.js";
import {
  fetchSignals,
  validateSignalTimeframe,
  timeframeToSeconds,
} from "../signal-provider.js";

const composer = new Composer<Ctx>();

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

composer.callbackQuery("trade:signals", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (!userId) return;

  const userData = await getUserData(userId);
  if (!userData || userData.session.loginStatus !== "logged_in") {
    await ctx.editMessageText(
      "You need to log in first. Tap Get Started to set up your account.",
      { reply_markup: backToMenu },
    );
    return;
  }

  if (!userData.session.autoTradingEnabled) {
    await ctx.editMessageText(
      "Auto-trading is paused. Resume it from the main menu.",
      { reply_markup: backToMenu },
    );
    return;
  }

  await ctx.editMessageText("Checking for new signals…");

  let result;
  try {
    result = await fetchSignals();
  } catch {
    await ctx.editMessageText(
      "Couldn't reach the signal provider. Try again in a moment.",
      { reply_markup: backToMenu },
    );
    return;
  }

  if (!result.success || !result.signals || result.signals.length === 0) {
    await ctx.editMessageText(
      `No signals available: ${result.error ?? "No signals found"}.`,
      { reply_markup: backToMenu },
    );
    return;
  }

  const validSignals = result.signals.filter((s) =>
    validateSignalTimeframe(s, userData.settings.timeframe),
  );

  if (validSignals.length === 0) {
    await ctx.editMessageText(
      "No signals match your current timeframe.",
      { reply_markup: backToMenu },
    );
    return;
  }

  let processed = 0;
  let succeeded = 0;

  for (const signal of validSignals) {
    processed++;
    const tradeReq: PocketOptionTradeRequest = {
      token: "",
      action: signal.action,
      amount: userData.settings.tradeAmount,
      timeframe: timeframeToSeconds(userData.settings.timeframe),
      instrument: signal.instrument,
    };

    let tradeResult;
    try {
      tradeResult = await executeTrade(tradeReq);
    } catch {
      tradeResult = { success: false, error: "Network error" };
    }

    userData.session.tradesExecuted = (userData.session.tradesExecuted ?? 0) + 1;
    if (tradeResult.success) {
      succeeded++;
      userData.session.winCount = (userData.session.winCount ?? 0) + 1;
    } else {
      userData.session.lossCount = (userData.session.lossCount ?? 0) + 1;
    }
  }

  await saveUserData(userId, userData);
  ctx.session.tradesExecuted = userData.session.tradesExecuted;
  ctx.session.winCount = userData.session.winCount;
  ctx.session.lossCount = userData.session.lossCount;

  const summary = [
    `Processed ${processed} signal(s).`,
    `Executed: ${succeeded} win(s), ${processed - succeeded} loss(es).`,
    `Total trades: ${userData.session.tradesExecuted}.`,
  ].join("\n");

  await ctx.editMessageText(summary, {
    reply_markup: backToMenu,
  });
});

export default composer;
