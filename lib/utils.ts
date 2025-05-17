import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper para gerar IDs únicos (alternativa ao uuid se não quiseres a dependência)
export function generateId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
}
