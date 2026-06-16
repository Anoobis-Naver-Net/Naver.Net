export default async function handler(request) {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': '*',
            }
        });
    }

    const url     = new URL(request.url);
    const symbol  = url.searchParams.get('symbol');
    const isIndex = url.searchParams.get('isIndex') === 'true';

    const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' };

    if (!symbol) {
        return new Response(JSON.stringify({ error: 'symbol 파라미터 필요' }), { status: 400, headers: HEADERS });
    }

    const reqHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
        'Referer': 'https://finance.yahoo.com/',
        'Origin': 'https://finance.yahoo.com',
    };

    /* ── 1. 가격 데이터 (v8/chart) ── */
    const chartTargets = [
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
        `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
    ];

    let priceData = null;
    for (const target of chartTargets) {
        try {
            const res = await fetch(target, { headers: reqHeaders });
            if (!res.ok) continue;
            priceData = await res.json();
            break;
        } catch { continue; }
    }

    if (!priceData) {
        return new Response(JSON.stringify({ error: '가격 데이터 실패' }), { status: 502, headers: HEADERS });
    }

    /* ── 2. PER/시총 (개별주식만, 야후 웹 스크래핑) ── */
    let per = null, marketCap = null;

    if (!isIndex) {
        try {
            const pageUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;
            const pageRes = await fetch(pageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            });

            if (pageRes.ok) {
                const html = await pageRes.text();

                /* PE Ratio */
                const peMatch = html.match(/"trailingPE":\s*\{[^}]*"raw":\s*([\d.]+)/);
                if (peMatch) per = parseFloat(peMatch[1]);

                /* Market Cap */
                const mcMatch = html.match(/"marketCap":\s*\{[^}]*"raw":\s*([\d.]+)/);
                if (mcMatch) marketCap = parseFloat(mcMatch[1]);
            }
        } catch { /* 실패해도 가격만 반환 */ }
    }

    return new Response(JSON.stringify({ ...priceData, per, marketCap }), { headers: HEADERS });
}

export const config = { path: '/api/stock' };
