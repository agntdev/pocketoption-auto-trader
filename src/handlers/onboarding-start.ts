import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import {
  registerMainMenuItem,
  inlineButton,
  inlineKeyboard,
} from "../toolkit/index.js";
import { encrypt, getUserData, saveUserData, createDefaultUserData } from "../storage.js";
import { loginToPocketOption } from "../pocket-option.js";

registerMainMenuItem({ label: "Get Started 🚀", data: "onboarding:start", order: 10 });

const WELCOME =
  "Welcome to PocketOption Auto-Trader.\n\n" +
  "I'll set up automated trading for your account. " +
  "Tap the button below to begin.";

const EMAIL_PROMPT = "Enter your PocketOption email address:";
const PASSWORD_PROMPT = "Enter your PocketOption password:";
const ACCOUNT_TYPE_PROMPT = "Select your account type:";
const TRADE_AMOUNT_PROMPT = "Enter your trade amount in USD (e.g. 1, 5, 10):";
const TIMEFRAME_PROMPT = "Select your trade timeframe:";

const accountTypeKeyboard = inlineKeyboard([
  [
    inlineButton("Real", "onboarding:account:real"),
    inlineButton("Demo", "onboarding:account:demo"),
  ],
]);

const timeframeKeyboard = inlineKeyboard([
  [
    inlineButton("1m", "onboarding:tf:1m"),
    inlineButton("5m", "onboarding:tf:5m"),
  ],
  [
    inlineButton("30m", "onboarding:tf:30m"),
    inlineButton("1h", "onboarding:tf:1h"),
  ],
]);

function backToMenu() {
  return inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]);
}

const composer = new Composer<Ctx>();

composer.callbackQuery("onboarding:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (!userId) return;
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  let userData = getUserData(userId);
  if (!userData) {
    userData = createDefaultUserData(userId, chatId);
    saveUserData(userId, userData);
  }

  ctx.session.onboardingStep = "email";
  await ctx.editMessageText(WELCOME, {
    reply_markup: inlineKeyboard([
      [inlineButton("Get Started 🚀", "onboarding:begin")],
    ]),
  });
});

composer.callbackQuery("onboarding:begin", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.onboardingStep = "email";
  await ctx.editMessageText(EMAIL_PROMPT);
});

composer.on("message:text", async (ctx, next) => {
  const step = ctx.session.onboardingStep;
  if (step !== "email" && step !== "password" && step !== "trade_amount") {
    return next();
  }

  const userId = ctx.from?.id;
  if (!userId) return;
  const text = ctx.message.text.trim();

  if (step === "email") {
    if (!text.includes("@") || text.length < 3) {
      await ctx.reply("That doesn't look like a valid email. Try again:");
      return;
    }
    let userData = getUserData(userId);
    if (!userData) {
      userData = createDefaultUserData(userId, ctx.chat?.id ?? 0);
    }
    userData.credentials.email = text;
    saveUserData(userId, userData);
    ctx.session.email = text;
    ctx.session.onboardingStep = "password";
    await ctx.reply(PASSWORD_PROMPT);
    return;
  }

  if (step === "password") {
    if (text.length < 1) {
      await ctx.reply("Password can't be empty. Try again:");
      return;
    }
    let userData = getUserData(userId);
    if (!userData) {
      userData = createDefaultUserData(userId, ctx.chat?.id ?? 0);
    }
    userData.credentials.encryptedPassword = encrypt(text);
    saveUserData(userId, userData);
    ctx.session.password = text;
    ctx.session.onboardingStep = "account_type";
    await ctx.reply(ACCOUNT_TYPE_PROMPT, { reply_markup: accountTypeKeyboard });
    return;
  }

  if (step === "trade_amount") {
    const amount = parseFloat(text);
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply("Please enter a valid positive number (e.g. 1, 5, 10):");
      return;
    }
    let userData = getUserData(userId);
    if (!userData) {
      userData = createDefaultUserData(userId, ctx.chat?.id ?? 0);
    }
    userData.settings.tradeAmount = amount;
    saveUserData(userId, userData);
    ctx.session.tradeAmount = amount;
    ctx.session.onboardingStep = "timeframe";
    await ctx.reply(TIMEFRAME_PROMPT, { reply_markup: timeframeKeyboard });
    return;
  }
});

composer.callbackQuery("onboarding:account:real", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (!userId) return;
  let userData = getUserData(userId);
  if (!userData) {
    userData = createDefaultUserData(userId, ctx.chat?.id ?? 0);
  }
  userData.settings.accountType = "real";
  saveUserData(userId, userData);
  ctx.session.accountType = "real";
  ctx.session.onboardingStep = "trade_amount";
  await ctx.editMessageText(TRADE_AMOUNT_PROMPT);
});

composer.callbackQuery("onboarding:account:demo", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (!userId) return;
  let userData = getUserData(userId);
  if (!userData) {
    userData = createDefaultUserData(userId, ctx.chat?.id ?? 0);
  }
  userData.settings.accountType = "demo";
  saveUserData(userId, userData);
  ctx.session.accountType = "demo";
  ctx.session.onboardingStep = "trade_amount";
  await ctx.editMessageText(TRADE_AMOUNT_PROMPT);
});

composer.callbackQuery(/^onboarding:tf:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const timeframe = ctx.match?.[1] as "1m" | "5m" | "30m" | "1h" | undefined;
  if (!timeframe) return;
  const userId = ctx.from?.id;
  if (!userId) return;

  let userData = getUserData(userId);
  if (!userData) {
    userData = createDefaultUserData(userId, ctx.chat?.id ?? 0);
  }
  userData.settings.timeframe = timeframe;
  saveUserData(userId, userData);
  ctx.session.timeframe = timeframe;
  ctx.session.onboardingStep = "done";

  await ctx.editMessageText("Logging in to PocketOption…");

  const result = await loginToPocketOption({
    email: userData.credentials.email,
    password: userData.credentials.encryptedPassword,
    accountType: userData.settings.accountType,
  });

  if (result.success) {
    userData.session.loginStatus = "logged_in";
    userData.session.autoTradingEnabled = true;
    saveUserData(userId, userData);
    ctx.session.loggedIn = true;
    ctx.session.autoTradingEnabled = true;
    await ctx.editMessageText(
      "✅ Login successful. Auto-trading is now enabled.",
      { reply_markup: backToMenu() },
    );
  } else {
    userData.session.loginStatus = "login_failed";
    saveUserData(userId, userData);
    ctx.session.loggedIn = false;
    await ctx.editMessageText(
      `Login failed: ${result.error ?? "Unknown error"}. Tap below to retry.`,
      {
        reply_markup: inlineKeyboard([
          [inlineButton("Retry login", "onboarding:start")],
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      },
    );
  }
});

export default composer;
