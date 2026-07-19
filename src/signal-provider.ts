const SIGNAL_PROVIDER_URL = process.env.SIGNAL_PROVIDER_URL ?? "";

export interface TradeSignal {
  signalTimestamp: number;
  action: "call" | "put";
  instrument: string;
  confidenceLevel: number;
  timeframe: string;
}

export interface SignalProviderResponse {
  success: boolean;
  signals?: TradeSignal[];
  error?: string;
}

export async function fetchSignals(): Promise<SignalProviderResponse> {
  if (!SIGNAL_PROVIDER_URL) {
    return { success: false, error: "Signal provider URL not configured" };
  }
  try {
    const response = await fetch(`${SIGNAL_PROVIDER_URL}/signals`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { success: false, error: `Signal fetch failed (${response.status}): ${body}` };
    }
    return (await response.json()) as SignalProviderResponse;
  } catch (err) {
    return { success: false, error: `Network error: ${(err as Error).message}` };
  }
}

export function validateSignalTimeframe(
  signal: TradeSignal,
  userTimeframe: string,
): boolean {
  return signal.timeframe === userTimeframe;
}

const TIMEFRAME_SECONDS: Record<string, number> = {
  "1m": 60,
  "5m": 300,
  "30m": 1800,
  "1h": 3600,
};

export function timeframeToSeconds(timeframe: string): number {
  return TIMEFRAME_SECONDS[timeframe] ?? 60;
}
