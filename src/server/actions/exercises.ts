"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

const MUSCLE = z.enum([
  "CHEST",
  "BACK",
  "LEGS",
  "SHOULDERS",
  "ARMS",
  "CORE",
  "CARDIO",
]);

/** Catalogue (userId null) + this user's custom exercises. */
export async function listExercises(query?: string) {
  const user = await requireAuth();
  const q = z.string().max(80).optional().parse(query)?.trim() || undefined;
  return db.exercise.findMany({
    where: {
      OR: [{ userId: null }, { userId: user.id }],
      ...(q
        ? { name: { contains: q, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  });
}

const CreateExercise = z.object({
  name: z.string().min(1).max(80),
  muscleGroup: MUSCLE,
});

export async function createCustomExercise(raw: unknown) {
  const user = await requireAuth();
  const data = CreateExercise.parse(raw);
  const ex = await db.exercise.create({
    data: {
      name: data.name.trim(),
      muscleGroup: data.muscleGroup,
      isCustom: true,
      userId: user.id,
    },
  });
  revalidatePath("/exercises");
  return ex;
}
