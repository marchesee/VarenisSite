import 'dotenv/config';

const token = process.env.PRINTFUL_API_TOKEN;
const headers = { Authorization: `Bearer ${token}` };

// 1. List store products
const res = await fetch('https://api.printful.com/store/products', { headers });
const body = await res.json();

if (body.code !== 200) {
  console.error('Error from Printful:', JSON.stringify(body, null, 2));
  process.exit(1);
}
if (!body.result?.length) {
  console.log('No products found on this store. Is the token scoped to the right store?');
  process.exit(0);
}

// 2. For each product, list its variants + the variant_id you need
for (const p of body.result) {
  console.log(`\n=== ${p.name} (store product id ${p.id}) ===`);
  const detail = await fetch(
    `https://api.printful.com/store/products/${p.id}`,
    { headers }
  ).then(r => r.json());

  for (const v of detail.result.sync_variants) {
    console.log(`  size/color: ${v.name}`);
    console.log(`    sync_variant_id: ${v.id}`);
  }
}