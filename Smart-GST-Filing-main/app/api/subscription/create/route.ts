import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planType, paymentId, notes } = body;

    if (!userId || !planType) {
      return NextResponse.json(
        { error: 'userId and planType are required' },
        { status: 400 }
      );
    }

    const pricingMap: Record<string, number> = {
      Monthly: 999,
      HalfYearly: 5499,
      Yearly: 9999,
    };

    const response = await fetch(`${BACKEND_URL}/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        planType,
        price: pricingMap[planType] || 0,
        paymentId,
        notes,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
