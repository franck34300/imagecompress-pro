import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request) {
  console.log('🚀 API create-checkout appelée');
  
  try {
    // Vérifier STRIPE_SECRET_KEY
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY manquante');
      return NextResponse.json(
        { error: 'Configuration Stripe manquante - Clé secrète' },
        { status: 500 }
      );
    }

    // Vérifier STRIPE_PRICE_ID
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    if (!priceId) {
      console.error('❌ STRIPE_PRICE_ID manquant');
      return NextResponse.json(
        { error: 'Configuration Stripe manquante - Price ID' },
        { status: 500 }
      );
    }

    console.log('✅ Variables d\'environnement OK');
    console.log('📌 Price ID:', priceId);

    // Initialiser Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    console.log('✅ Stripe initialisé');

    // Créer la session de paiement
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get('origin')}/?success=true`,
      cancel_url: `${request.headers.get('origin')}/?canceled=true`,
    });

    console.log('✅ Session Stripe créée:', session.id);

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
