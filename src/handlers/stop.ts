import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { registerMainMenuItem, inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getUserData, saveUserData } from "../storage.js";

registerMainMenuItem({ label: "⏹ Stop", data: "stop:trading", order: 40 });

const composer = new Composer<Ctx>();

const backToMenu = inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);

async function stopTrading(ctx: Ctx): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const userData = await getUserData(userId);
  if (userData) {
    userData.session.autoTradingEnabled = false;
    await saveUserData(userId, userData);
  }
  ctx.session.autoTradingEnabled = false;

  await ctx.reply("Auto-trading has been stopped.", {
    reply_markup: backToMenu,
  });
}

composer.command("stop", stopTrading);

composer.callbackQuery("stop:trading", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (!userId) return;

  const userData = await getUserData(userId);
  if (userData) {
    userData.session.autoTradingEnabled = false;
    await saveUserData(userId, userData);
  }
  ctx.session.autoTradingEnabled = false;

  await ctx.editMessageText("Auto-trading has been stopped.", {
    reply_markup: backToMenu,
  });
});

export default composer;
