import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebaseConfig';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export async function PUT(request: NextRequest) {
  try {
    const { accountId, userId, balance, lastTransactions } = await request.json();

    if (!accountId || !userId) {
      return NextResponse.json({ error: 'Account ID and User ID are required' }, { status: 400 });
    }

    // First verify the account belongs to the user
    const accountRef = doc(db, 'linkedAccounts', accountId);
    const accountSnap = await getDoc(accountRef);

    if (!accountSnap.exists()) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const accountData = accountSnap.data();
    if (accountData.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the account
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };

    if (balance !== undefined) updateData.balance = balance;
    if (lastTransactions !== undefined) updateData.lastTransactions = lastTransactions;

    await updateDoc(accountRef, updateData);

    return NextResponse.json({ message: 'Account updated successfully' });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}