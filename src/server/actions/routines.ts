"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { limitsFor } from "@/lib/plan";

export async function listRoutines() {
  const user = await requireAuth();
  return db.routine.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: { exercise: true },
      },
    },
  });
}

const CreateRoutine = z.object({
  name: z.string().min(1).max(60),
  exerciseIds: z.array(z.string()).min(1).max(30),
});

export async function createRoutine(raw: unknown) {
  const user = await requireAuth();
  const data = CreateRoutine.parse(raw);

  const count = await db.routine.count({ where: { userId: user.id } });
  if (count >= limitsFor(user.plan).maxRoutines) {
    throw new Error(
      "Free plan is limited to 1 routine. Upgrade to Pro for unlimited routines.",
    );
  }

  const routine = await db.routine.create({
    data: {
      userId: user.id,
      name: data.name.trim(),
      items: {
        create: data.exerciseIds.map((exerciseId, order) => ({
          exerciseId,
          order,
        })),
      },
    },
  });
  revalidatePath("/routines");
  return routine;
}

export async function deleteRoutine(routineIdRaw: string) {
  const user = await requireAuth();
  const routineId = z.string().min(1).max(40).parse(routineIdRaw);
  const r = await db.routine.findUnique({ where: { id: routineId } });
  if (!r || r.userId !== user.id) throw new Error("Routine not found");
  await db.routine.delete({ where: { id: routineId } });
  revalidatePath("/routines");
}
