import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-03-25.dahlia',
  });
}

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    const { intentId, intentTitle, ticker, amountUSDC } = await req.json();

    if (!amountUSDC || amountUSDC <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Fund ${ticker} — ${intentTitle}`,
              description: `EIP-8183 Escrow funding for research intent ${ticker}`,
            },
            unit_amount: Math.round(amountUSDC * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&intent_id=${intentId}&amount=${amountUSDC}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/intent/${intentId}?payment=cancelled`,
      metadata: {
        intentId,
        ticker,
        amountUSDC: String(amountUSDC),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe checkout error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
