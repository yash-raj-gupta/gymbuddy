import type { MuscleGroup } from "@/generated/prisma/enums";

// Seeded catalogue — gymbuddy-prd.md §4 feature 2.
export const EXERCISE_CATALOGUE: { name: string; muscleGroup: MuscleGroup }[] = [
  // Chest
  { name: "Barbell Bench Press", muscleGroup: "CHEST" },
  { name: "Incline Dumbbell Press", muscleGroup: "CHEST" },
  { name: "Flat Dumbbell Press", muscleGroup: "CHEST" },
  { name: "Cable Fly", muscleGroup: "CHEST" },
  { name: "Machine Chest Press", muscleGroup: "CHEST" },
  { name: "Push-up", muscleGroup: "CHEST" },
  { name: "Dips", muscleGroup: "CHEST" },
  // Back
  { name: "Deadlift", muscleGroup: "BACK" },
  { name: "Pull-up", muscleGroup: "BACK" },
  { name: "Lat Pulldown", muscleGroup: "BACK" },
  { name: "Barbell Row", muscleGroup: "BACK" },
  { name: "Seated Cable Row", muscleGroup: "BACK" },
  { name: "Single-arm Dumbbell Row", muscleGroup: "BACK" },
  { name: "Face Pull", muscleGroup: "BACK" },
  // Legs
  { name: "Back Squat", muscleGroup: "LEGS" },
  { name: "Front Squat", muscleGroup: "LEGS" },
  { name: "Leg Press", muscleGroup: "LEGS" },
  { name: "Romanian Deadlift", muscleGroup: "LEGS" },
  { name: "Walking Lunge", muscleGroup: "LEGS" },
  { name: "Leg Extension", muscleGroup: "LEGS" },
  { name: "Lying Leg Curl", muscleGroup: "LEGS" },
  { name: "Standing Calf Raise", muscleGroup: "LEGS" },
  // Shoulders
  { name: "Overhead Press", muscleGroup: "SHOULDERS" },
  { name: "Seated Dumbbell Press", muscleGroup: "SHOULDERS" },
  { name: "Lateral Raise", muscleGroup: "SHOULDERS" },
  { name: "Rear Delt Fly", muscleGroup: "SHOULDERS" },
  { name: "Arnold Press", muscleGroup: "SHOULDERS" },
  // Arms
  { name: "Barbell Curl", muscleGroup: "ARMS" },
  { name: "Dumbbell Curl", muscleGroup: "ARMS" },
  { name: "Hammer Curl", muscleGroup: "ARMS" },
  { name: "Triceps Pushdown", muscleGroup: "ARMS" },
  { name: "Skull Crusher", muscleGroup: "ARMS" },
  { name: "Overhead Triceps Extension", muscleGroup: "ARMS" },
  // Core
  { name: "Plank", muscleGroup: "CORE" },
  { name: "Hanging Leg Raise", muscleGroup: "CORE" },
  { name: "Cable Crunch", muscleGroup: "CORE" },
  { name: "Russian Twist", muscleGroup: "CORE" },
  { name: "Ab Wheel Rollout", muscleGroup: "CORE" },
  // Cardio
  { name: "Treadmill Run", muscleGroup: "CARDIO" },
  { name: "Cycling", muscleGroup: "CARDIO" },
  { name: "Rowing Machine", muscleGroup: "CARDIO" },
  { name: "Stair Climber", muscleGroup: "CARDIO" },
  { name: "Jump Rope", muscleGroup: "CARDIO" },
];

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "CHEST",
  "BACK",
  "LEGS",
  "SHOULDERS",
  "ARMS",
  "CORE",
  "CARDIO",
];
