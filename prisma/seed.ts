import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { EXERCISE_CATALOGUE } from "../src/lib/exercise-catalogue";

loadEnv({ path: ".env.local" });
loadEnv();

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  let created = 0;
  for (const ex of EXERCISE_CATALOGUE) {
    const exists = await db.exercise.findFirst({
      where: { name: ex.name, userId: null },
    });
    if (!exists) {
      await db.exercise.create({
        data: { name: ex.name, muscleGroup: ex.muscleGroup, isCustom: false },
      });
      created++;
    }
  }
  console.log(`Seed done: ${created} catalogue exercises added.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
