import { getAllTokens } from './src/services/tokenService';

async function main() {
  const tokens = await getAllTokens();
  const token = tokens.find(t => t.logo && t.logo.startsWith('http'));
  if (token) {
    console.log('Found token:', token.symbol);
    console.log('URL:', token.logo);
    const res = await fetch(token.logo);
    console.log('HTTP Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    console.log('Bucket public?', res.status === 200 ? 'Yes' : 'No');
  } else {
    console.log('No token with http logo found.');
  }
}
main().catch(console.error);
