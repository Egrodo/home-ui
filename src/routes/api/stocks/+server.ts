import { json } from '@sveltejs/kit';
import { STOCK_TICKERS } from '$env/static/private';
import type { RequestHandler } from './$types';
import type { StockData } from '$lib/data/types';

const TICKERS = STOCK_TICKERS.split(',').map((t) => t.trim());

async function fetchStock(ticker: string): Promise<StockData> {
	const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1m&range=1d`;
	const res = await fetch(url, {
		headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' }
	});

	if (!res.ok) throw new Error(`HTTP ${res.status} for ${ticker}`);

	const data = await res.json();
	const result = data.chart.result?.[0];
	if (!result) throw new Error(`No result for ${ticker}`);

	const meta = result.meta;
	const closes: (number | null)[] = result.indicators.quote[0].close;

	const prevClose: number = meta.chartPreviousClose;
	const price: number = meta.regularMarketPrice;
	const change = price - prevClose;
	const changePercent = (change / prevClose) * 100;

	// Downsample to every 5 minutes, drop nulls, normalize to 0–1 for sparkline
	const sampled = closes
		.filter((_, i) => i % 5 === 0)
		.filter((c): c is number => c !== null);
	const min = Math.min(...sampled);
	const max = Math.max(...sampled);
	const range = max - min || 1;
	const sparkline = sampled.map((c) => (c - min) / range);

	return { ticker, price, change, changePercent, sparkline };
}

export const GET: RequestHandler = async () => {
	const results = await Promise.allSettled(TICKERS.map(fetchStock));

	const stocks = results
		.filter((r): r is PromiseFulfilledResult<StockData> => r.status === 'fulfilled')
		.map((r) => r.value);

	return json(stocks);
};
