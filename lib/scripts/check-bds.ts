import { listBusinesses } from '@/lib/data/businesses';

async function main() {
  const result = await listBusinesses();

  if (result.error) {
    console.error('Error:', result.error);
    return;
  }

  if (!result.data || result.data.length === 0) {
    console.log('No business domains found');
    return;
  }

  console.log(`Found ${result.data.length} business domains:`);
  result.data.forEach((bd) => {
    console.log(`  ${bd.id}: ${bd.name} (area: ${bd.area})`);
  });
}

main();
