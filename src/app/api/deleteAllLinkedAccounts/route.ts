import { NextResponse } from "next/server";
import { db } from "@/src/firebaseConfig";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const q = query(collection(db, "linkedAccounts"), where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const batchDeletes = snapshot.docs.map((d) => deleteDoc(doc(db, "linkedAccounts", d.id)));
    await Promise.all(batchDeletes);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ API /deleteAllLinkedAccounts error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
    `AQX`