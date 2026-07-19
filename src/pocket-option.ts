const POCKET_OPTION_API_URL = process.env.POCKET_OPTION_API_URL ?? "";

export interface PocketOptionLoginRequest {
  email: string;
  password: string;
  accountType: "real" | "demo";
}

export interface PocketOptionLoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export interface PocketOptionTradeRequest {
  token: string;
  action: "call" | "put";
  amount: number;
  timeframe: number;
  instrument: string;
}

export interface PocketOptionTradeResponse {
  success: boolean;
  tradeId?: string;
  error?: string;
  payout?: number;
}

export interface PocketOptionAccountInfo {
  success: boolean;
  balance?: number;
  currency?: string;
  error?: string;
}

export async function loginToPocketOption(
  req: PocketOptionLoginRequest,
): Promise<PocketOptionLoginResponse> {
  if (!POCKET_OPTION_API_URL) {
    return { success: false, error: "PocketOption API URL not configured" };
  }
  try {
    const response = await fetch(`${POCKET_OPTION_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: req.email,
        password: req.password,
        account_type: req.accountType,
      }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { success: false, error: `Login failed (${response.status}): ${body}` };
    }
    return (await response.json()) as PocketOptionLoginResponse;
  } catch (err) {
    return { success: false, error: `Network error: ${(err as Error).message}` };
  }
}

export async function executeTrade(
  req: PocketOptionTradeRequest,
): Promise<PocketOptionTradeResponse> {
  if (!POCKET_OPTION_API_URL) {
    return { success: false, error: "PocketOption API URL not configured" };
  }
  try {
    const response = await fetch(`${POCKET_OPTION_API_URL}/trade/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${req.token}`,
      },
      body: JSON.stringify({
        action: req.action,
        amount: req.amount,
        timeframe: req.timeframe,
        instrument: req.instrument,
      }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { success: false, error: `Trade failed (${response.status}): ${body}` };
    }
    return (await response.json()) as PocketOptionTradeResponse;
  } catch (err) {
    return { success: false, error: `Network error: ${(err as Error).message}` };
  }
}

export async function getAccountInfo(token: string): Promise<PocketOptionAccountInfo> {
  if (!POCKET_OPTION_API_URL) {
    return { success: false, error: "PocketOption API URL not configured" };
  }
  try {
    const response = await fetch(`${POCKET_OPTION_API_URL}/account/info`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { success: false, error: `Account info failed (${response.status}): ${body}` };
    }
    return (await response.json()) as PocketOptionAccountInfo;
  } catch (err) {
    return { success: false, error: `Network error: ${(err as Error).message}` };
  }
}
