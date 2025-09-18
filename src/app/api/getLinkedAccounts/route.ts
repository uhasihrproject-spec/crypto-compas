import { NextResponse } from "next/server";
import { db } from "@/src/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Query Firestore collection "linkedAccounts"
    const q = query(collection(db, "linkedAccounts"), where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const accounts = snapshot.docs.map((doc) => ({
      firestoreId: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(accounts, { status: 200 });
  } catch (error) {
    console.error("❌ API /getLinkedAccounts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
