import Stripe from "stripe";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";

function getStripe() {
  if (!process.env.STRIPE_SECRET) return null;
  return new Stripe(process.env.STRIPE_SECRET);
}

const PRICE_IDS = {
  subscription: process.env.STRIPE_PRICE_SUBSCRIPTION,
  oneoff: process.env.STRIPE_PRICE_ONEOFF,
  pack: process.env.STRIPE_PRICE_PACK,
};

function addOneMonth(ts) {
  const d = new Date(ts);
  d.setMonth(d.getMonth() + 1);
  return d.getTime();
}

export async function createCheckoutSession(req, res) {
  const stripe = getStripe();
  if (!stripe) {
    return res.json({ disabled: true, message: "Payments coming soon" });
  }

  // Checkout always needs a real uid
  const uid = req.authUser?.uid;
  if (!uid) {
    return res.status(401).json({ error: "Login required to purchase" });
  }

  const type = ["subscription", "oneoff", "pack"].includes(req.body?.type)
    ? req.body.type
    : "subscription";
  const priceId = PRICE_IDS[type];

  if (!priceId) {
    return res.json({ disabled: true, message: "Payments coming soon" });
  }

  try {
    const base = process.env.BASE_URL || "http://localhost:3000";
    const sessionParams = {
      payment_method_types: ["card"],
      mode: type === "subscription" ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/`,
      cancel_url: `${base}/`,
      metadata: { uid, type },
    };
    if (req.authUser?.email) sessionParams.customer_email = req.authUser.email;
    const session = await stripe.checkout.sessions.create(sessionParams);

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: "Could not start checkout. Please try again." });
  }
}

export async function handleWebhook(req, res) {
  const stripe = getStripe();
  if (!stripe) return res.json({ received: true });

  let event;
  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (secret && sig) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } catch (err) {
      console.error("Webhook signature error:", err.message);
      return res.status(400).json({ error: "Webhook signature invalid" });
    }
  } else {
    // Dev: trust raw parsed body
    try { event = JSON.parse(req.body); } catch { event = req.body; }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const uid = session.metadata?.uid;
    const type = session.metadata?.type;

    if (uid) {
      try {
        if (!getApps().length) throw new Error("Firebase Admin not initialised");
        const db = getFirestore();
        const userRef = db.collection("users").doc(uid);

        // Always store the Stripe customer ID so we can look up the user later
        const baseUpdate = {};
        if (session.customer) baseUpdate.stripeCustomerId = session.customer;

        if (type === "subscription") {
          const now = Date.now();
          await userRef.set({
            ...baseUpdate,
            isSubscribed: true,
            storiesRemaining: 62,
            subscriptionId: session.subscription || null,
            subscriptionStartDate: now,
            subscriptionEndDate: addOneMonth(now),
          }, { merge: true });
          console.log(`[Stripe] subscription activated → user ${uid}`);
        } else if (type === "oneoff") {
          await userRef.set({ ...baseUpdate, oneOffAvailable: true }, { merge: true });
          console.log(`[Stripe] oneOffAvailable=true → user ${uid}`);
        } else if (type === "pack") {
          await userRef.set({
            ...baseUpdate,
            extraStoryCredits: FieldValue.increment(10),
          }, { merge: true });
          console.log(`[Stripe] +10 extraStoryCredits → user ${uid}`);
        } else if (Object.keys(baseUpdate).length) {
          await userRef.set(baseUpdate, { merge: true });
        }
      } catch (err) {
        console.error("Firestore update error:", err.message);
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const customerId = event.data.object.customer;
    try {
      if (!getApps().length) throw new Error("Firebase Admin not initialised");
      const db = getFirestore();
      const snapshot = await db.collection("users")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();
      if (!snapshot.empty) {
        const userRef = snapshot.docs[0].ref;
        await userRef.update({
          isSubscribed: false,
          storiesRemaining: 0,
          subscriptionId: null,
        });
        console.log(`[Stripe] subscription cancelled → customer ${customerId}`);
      } else {
        console.warn(`[Stripe] cancellation received but no user found for customer ${customerId}`);
      }
    } catch (err) {
      console.error("Firestore cancellation error:", err.message);
    }
  }

  res.json({ received: true });
}
