import { NextRequest, NextResponse } from 'next/server';

// Blockchain API service
class ServerBlockchainAPI {
  static async getBitcoinData(address: string) {
    try {
      const response = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}?limit=10`);
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);
      
      const balance = (data.balance || 0) / 100000000;
      const transactions = (data.txrefs || []).slice(0, 10).map((tx: any) => ({
        hash: tx.tx_hash,
        amount: (tx.value / 100000000).toFixed(8),
        type: tx.tx_output_n === -1 ? 'sent' : 'received',
        timestamp: tx.confirmed,
        blockHeight: tx.block_height,
      }));

      return { balance: balance.toFixed(8), transactions };
    } catch (error) {
      throw new Error('Failed to fetch Bitcoin data');
    }
  }

  static async getEthereumData(address: string) {
    try {
      const apiKey = process.env.ETHERSCAN_API_KEY || 'YourEtherscanAPIKey';
      
      const [balanceResponse, txResponse] = await Promise.all([
        fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`),
        fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`)
      ]);
      
      const balanceData = await balanceResponse.json();
      const txData = await txResponse.json();
      
      const balance = parseFloat(balanceData.result) / Math.pow(10, 18);
      const transactions = (txData.result || []).slice(0, 10).map((tx: any) => ({
        hash: tx.hash,
        amount: (parseFloat(tx.value) / Math.pow(10, 18)).toFixed(6),
        type: tx.from.toLowerCase() === address.toLowerCase() ? 'sent' : 'received',
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
        from: tx.from,
        to: tx.to,
        blockNumber: tx.blockNumber,
      }));

      return { balance: balance.toFixed(6), transactions };
    } catch (error) {
      throw new Error('Failed to fetch Ethereum data');
    }
  }

  static async getSolanaData(address: string) {
    try {
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address]
        })
      });
      
      const data = await response.json();
      const balance = (data.result?.value || 0) / Math.pow(10, 9);
      
      return { balance: balance.toFixed(6), transactions: [] };
    } catch (error) {
      throw new Error('Failed to fetch Solana data');
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { blockchain: string; address: string } }
) {
  try {
    const { blockchain, address } = params;

    if (!blockchain || !address) {
      return NextResponse.json({ error: 'Blockchain and address are required' }, { status: 400 });
    }

    let data;
    switch (blockchain.toLowerCase()) {
      case 'bitcoin':
        data = await ServerBlockchainAPI.getBitcoinData(address);
        break;
      case 'ethereum':
        data = await ServerBlockchainAPI.getEthereumData(address);
        break;
      case 'solana':
        data = await ServerBlockchainAPI.getSolanaData(address);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported blockchain' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching blockchain data:`, error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}