import { readFileSync } from 'fs';
import { pathToFileURL } from 'url';

// Direct file import to bypass exports map
const coreUrl = pathToFileURL('node_modules/@rango-dev/provider-all/node_modules/@rango-dev/wallets-core/dist/mod.js').href;
const { pickVersion, Provider } = await import(coreUrl);

const { allProviders } = await import('@rango-dev/provider-all');

const providers = allProviders({ walletconnect2: { WC_PROJECT_ID: '415c3acc79193f57cc8541c3f3928b89' } });
console.log('Total providers:', providers.length);

for (let i = 0; i < providers.length; i++) {
  try {
    const built = providers[i]();
    let picked;
    try {
      picked = pickVersion(built, '1.0.0')[1];
    } catch {
      picked = pickVersion(built, '0.0.0')[1];
    }

    if (picked instanceof Provider) {
      console.log(`${i} OK Provider id=${picked.id}`);
    } else if (picked && picked.config && picked.config.type) {
      console.log(`${i} OK legacy type=${picked.config.type}`);
    } else {
      console.log(`${i} BROKEN - instanceof=${picked?.constructor?.name} hasConfig=${picked?.config !== undefined} keys=${Object.keys(picked || {}).slice(0,10)}`);
    }
  } catch(e) {
    console.log(`${i} ERROR: ${e.message?.slice(0,200)}`);
  }
}
