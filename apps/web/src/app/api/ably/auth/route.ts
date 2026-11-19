import { NextRequest, NextResponse } from 'next/server';
import { createAblyTokenRequest } from '@/lib/ably-server';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const clientId = searchParams.get('clientId') || `player_${nanoid(8)}`;

    const tokenRequest = await createAblyTokenRequest(clientId);
    return NextResponse.json(tokenRequest);
  } catch (err: any) {
    // If Ably is not configured in local environment, return clear notification
    if (!process.env.ABLY_API_KEY) {
      return NextResponse.json(
        {
          error: 'ABLY_NOT_CONFIGURED',
          message: 'ABLY_API_KEY is not configured on this deployment. Please set ABLY_API_KEY in environment.'
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: err.message || 'Token generation failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let clientId = `player_${nanoid(8)}`;
    try {
      const body = await req.json();
      if (body?.clientId) clientId = body.clientId;
    } catch {
      // body empty or not json
    }

    const tokenRequest = await createAblyTokenRequest(clientId);
    return NextResponse.json(tokenRequest);
  } catch (err: any) {
    if (!process.env.ABLY_API_KEY) {
      return NextResponse.json(
        {
          error: 'ABLY_NOT_CONFIGURED',
          message: 'ABLY_API_KEY is not configured on this deployment.'
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: err.message || 'Token generation failed' }, { status: 500 });
  }
}
