import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebaseConfig';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';

export async function DELETE(request: NextRequest) {
  try {
    const { accountId, userId } = await request.json();

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

    // Delete the account
    await deleteDoc(accountRef);

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting linked account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
