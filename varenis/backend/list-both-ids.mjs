import 'dotenv/config';

const token = process.env.PRINTFUL_API_TOKEN;
const headers = { Authorization: `Bearer ${token}` };

const res = await fetch('https://api.printful.com/store/products', { headers });
const body = await res.json();

if (body.code !== 200 || !body.result?.length) {
  console.error('Problem:', JSON.stringify(body, null, 2));
  process.exit(1);
}

for (const p of body.result) {
  console.log(`\n=== ${p.name} (store product id ${p.id}) ===`);
  const detail = await fetch(
    `https://api.printful.com/store/products/${p.id}`,
    { headers }
  ).then(r => r.json());

  for (const v of detail.result.sync_variants) {
    // v.id = sync_variant_id (for ORDERS), v.variant_id = catalog id (for SHIPPING)
    console.log(`  ${v.name}`);
    console.log(`    sync_variant_id: ${v.id}   catalog_variant_id: ${v.variant_id}`);
  }
}
