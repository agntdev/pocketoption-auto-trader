import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getUserData, saveUserData } from "../storage.js";

const composer = new Composer<Ctx>();

composer.command("stop", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const userData = getUserData(userId);
  if (userData) {
    userData.session.autoTradingEnabled = false;
    saveUserData(userId, userData);
  }
  ctx.session.autoTradingEnabled = false;

  await ctx.reply("Auto-trading has been stopped.", {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
