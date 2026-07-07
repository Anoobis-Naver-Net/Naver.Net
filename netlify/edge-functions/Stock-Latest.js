import { getStore } from "@netlify/blobs";

const LATEST_ANY_KEY = "latest";

function keyForSymbols(rawList) {
    return "symbols:" + rawList;
}

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

    const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    const url    = new URL(request.url);
    const single = url.searchParams.get('symbol');
    const multi  = url.searchParams.get('symbols');
    const rawList = multi || single;

    try {
        const store = getStore("stock-cache");
        // symbols가 지정됐으면 해당 조합의 저장값을, 없으면 가장 최근 저장값을 반환한다.
        const saved = await store.get(rawList ? keyForSymbols(rawList) : LATEST_ANY_KEY, { type: "json" });

        if (!saved) {
            return new Response(JSON.stringify({ data: null }), { status: 200, headers: HEADERS });
        }

        return new Response(JSON.stringify({ data: saved }), { status: 200, headers: HEADERS });
    } catch (e) {
        return new Response(JSON.stringify({ data: null, error: '서버 내부 오류', detail: e.message }), { status: 500, headers: HEADERS });
    }
}

export const config = { path: '/api/stock-latest' };
