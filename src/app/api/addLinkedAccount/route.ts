import { NextResponse } from "next/server";
import { db } from "@/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, blockchain, address, balance, balanceUSD } = body;

    if (!userId || !blockchain || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const docRef = await addDoc(collection(db, "linkedAccounts"), {
      userId,
      blockchain,
      address,
      balance: balance || "0",
      balanceUSD: balanceUSD || "0",
      createdAt: Date.now(), // ✅ Save timestamp when account was linked
    });

    return NextResponse.json(
      { success: true, firestoreId: docRef.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ API /addLinkedAccount error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
