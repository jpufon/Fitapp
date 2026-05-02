// Seed the exercises table from wger's public API.
// Idempotent: upserts on wgerId, so safe to re-run.
//
// Run: cd backend && npx tsx src/scripts/seedExercises.ts
//
// wger v2 API: https://wger.de/api/v2/
// Endpoint used: /exerciseinfo/ — returns exercise + nested muscles + equipment + category.
// Public, no auth required, paginated 20 per page (we walk it all).

import { prisma } from '../lib/prisma.js';

const WGER_BASE = 'https://wger.de/api/v2';
const ENGLISH_LANGUAGE_ID = 2;

type WgerCategory = { id: number; name: string };
type WgerMuscle = { id: number; name: string; name_en: string | null; is_front: boolean };
type WgerEquipment = { id: number; name: string };
type WgerTranslation = {
  id: number;
  name: string;
  description: string;
  language: number;
};
type WgerExerciseInfo = {
  id: number;
  uuid: string;
  category: WgerCategory;
  muscles: WgerMuscle[];
  muscles_secondary: WgerMuscle[];
  equipment: WgerEquipment[];
  translations: WgerTranslation[];
};
type WgerListResponse<T> = { count: number; next: string | null; results: T[] };

// wger category → our category. Strength is the default; cardio is its own.
function mapCategory(wgerCategory: string): string {
  const c = wgerCategory.toLowerCase();
  if (c === 'cardio') return 'cardio';
  return 'strength';
}

function muscleName(m: WgerMuscle): string {
  return (m.name_en && m.name_en.length > 0 ? m.name_en : m.name).trim();
}

function pickEnglishTranslation(translations: WgerTranslation[]): WgerTranslation | null {
  return translations.find((t) => t.language === ENGLISH_LANGUAGE_ID) ?? null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchAll(): Promise<WgerExerciseInfo[]> {
  const all: WgerExerciseInfo[] = [];
  let url: string | null = `${WGER_BASE}/exerciseinfo/?language=${ENGLISH_LANGUAGE_ID}&limit=100`;
  let page = 0;
  while (url) {
    page += 1;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`wger fetch failed (${res.status}) at page ${page}: ${url}`);
    }
    const data = (await res.json()) as WgerListResponse<WgerExerciseInfo>;
    all.push(...data.results);
    process.stdout.write(`  page ${page}: +${data.results.length} (total ${all.length}/${data.count})\n`);
    url = data.next;
  }
  return all;
}

async function seed() {
  console.log('Fetching exercises from wger...');
  const raw = await fetchAll();

  console.log(`Fetched ${raw.length} entries. Filtering + upserting...`);
  let upserted = 0;
  let skipped = 0;

  for (const ex of raw) {
    const en = pickEnglishTranslation(ex.translations);
    if (!en || !en.name) {
      skipped += 1;
      continue;
    }

    const data = {
      wgerId: ex.id,
      name: en.name.trim(),
      category: mapCategory(ex.category?.name ?? ''),
      primaryMuscles: ex.muscles.map(muscleName).filter(Boolean),
      secondaryMuscles: ex.muscles_secondary.map(muscleName).filter(Boolean),
      equipment: ex.equipment.map((e) => e.name.trim()).filter(Boolean),
      instructions: en.description ? stripHtml(en.description).slice(0, 4000) : null,
      movementType: null as string | null,
    };

    await prisma.exercise.upsert({
      where: { wgerId: ex.id },
      update: data,
      create: data,
    });
    upserted += 1;
  }

  console.log(`Done. Upserted ${upserted}, skipped ${skipped} (no English translation).`);
  await prisma.$disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
