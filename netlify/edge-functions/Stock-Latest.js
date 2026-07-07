import { getStore } from '@netlify/blobs';

function latestKeyFor(rawList) {
    // Stock.js와 동일한 키 규칙을 사용해야 저장값을 찾을 수 있다.
    return 'stock-latest:' + rawList;
}

const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

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

    const url    = new URL(request.url);
    const single = url.searchParams.get('symbol');
    const multi  = url.searchParams.get('symbols');
    const rawList = multi || single;

    if (!rawList) {
        return new Response(JSON.stringify({ error: 'symbol 또는 symbols 파라미터 필요' }), {
            status: 400,
            headers: HEADERS,
        });
    }

    try {
        const store = getStore('location-cache');
        const saved = await store.get(latestKeyFor(rawList), { type: 'json' });

        if (!saved) {
            return new Response(JSON.stringify({ data: null }), { status: 200, headers: HEADERS });
        }

        return new Response(JSON.stringify({
            data: saved.data,
            savedAt: saved.savedAt,
        }), { status: 200, headers: HEADERS });

    } catch (e) {
        return new Response(JSON.stringify({ data: null, error: '저장된 값 조회 실패', detail: e.message }), { status: 200, headers: HEADERS });
    }
}

export const config = { path: '/api/stock-latest' };
