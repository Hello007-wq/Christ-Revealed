import { all, initLocalDb, run } from '@/lib/local-db';
import supabase from '@/lib/supabase';
import { Merchandise } from '@/types';

type DbMerch = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  stock: number;
};

type SupabaseMerch = {
  id: string;
  name: string;
  price: number | string;
  description: string | null;
  image_url: string | null;
  stock: number | null;
};

let initialized = false;

async function ensureInit() {
  if (!initialized) {
    await initLocalDb();
    initialized = true;
  }
}

function mapDb(item: DbMerch): Merchandise {
  return {
    id: item.id,
    name: item.name,
    price: Number(item.price ?? 0),
    description: item.description ?? '',
    imageUrl: item.image_url ?? '',
    stock: Number(item.stock ?? 0),
  };
}

function mapSupabase(item: SupabaseMerch): Merchandise {
  return {
    id: String(item.id),
    name: String(item.name),
    price: Number(item.price ?? 0),
    description: item.description ?? '',
    imageUrl: item.image_url ?? '',
    stock: Number(item.stock ?? 0),
  };
}

async function cache(items: Merchandise[]) {
  const now = new Date().toISOString();
  for (const item of items) {
    await run(
      `INSERT OR REPLACE INTO merchandise
       (id, name, price, description, image_url, stock, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.name, item.price, item.description, item.imageUrl, item.stock, now]
    );
  }
}

async function getLocalMerch() {
  const rows = await all<DbMerch>(`SELECT * FROM merchandise ORDER BY id DESC`);
  return rows.map(mapDb);
}

async function fetchMerchFromSupabase() {
  const { data, error } = await supabase
    .from('merchandise')
    .select('id, name, price, description, image_url, stock')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapSupabase(row as SupabaseMerch));
}

export async function getMerchandise() {
  await ensureInit();
  const local = await getLocalMerch();
  if (local.length) {
    fetchMerchFromSupabase().then(cache).catch(() => undefined);
    return local;
  }
  try {
    const remote = await fetchMerchFromSupabase();
    await cache(remote);
    return remote;
  } catch {
    return local;
  }
}

export async function publishMerchandiseItems(items: Omit<Merchandise, 'id'>[]) {
  await ensureInit();

  const payload = items.map((item) => ({
    name: item.name,
    price: item.price,
    description: item.description,
    image_url: item.imageUrl,
    stock: item.stock,
  }));

  const { data, error } = await supabase
    .from('merchandise')
    .insert(payload)
    .select('id, name, price, description, image_url, stock');
  if (error) throw error;

  const created = (data ?? []).map((row) => mapSupabase(row as SupabaseMerch));
  await cache(created);
  return created;
}

export async function deleteMerchandiseById(id: string) {
  await ensureInit();
  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  if (uuidLike) {
    const { error } = await supabase.from('merchandise').delete().eq('id', id);
    if (error) throw error;
  }
  await run(`DELETE FROM merchandise WHERE id = ?`, [id]);
}
