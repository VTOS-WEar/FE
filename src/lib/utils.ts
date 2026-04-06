import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert gender value to Vietnamese text
export function getVietnamseGender(gender: string | number | undefined): string {
  if (gender === "1" || gender === 1 || gender === "Male" || gender === "Nam") return "Nam"
  if (gender === "2" || gender === 2 || gender === "Female" || gender === "Nữ") return "Nữ"
  if (gender === "3" || gender === 3 || gender === "Other" || gender === "Khác") return "Khác"
  return "Khác"
}

// Get numeric value for gender
export const genderMap: Record<string, number> = { "Nam": 1, "Nữ": 2, "Khác": 3 }
