"use server";

import { requireRole } from "@/lib/auth-utils";
import { Role } from "@/types/user";

export interface ActionResult {
  success: boolean;
  message: string;
  userRole?: string;
}

export async function editorWriteAction(contentName: string): Promise<ActionResult> {
  try {
    const user = await requireRole(Role.EDITOR);
    return {
      success: true,
      message: `[Server Verified] Sukses menyimpan/mengubah '${contentName}'.`,
      userRole: user.role,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Akses ditolak";
    return {
      success: false,
      message,
    };
  }
}

export async function adminOperationAction(operationName: string): Promise<ActionResult> {
  try {
    const user = await requireRole(Role.ADMIN);
    return {
      success: true,
      message: `[Server Verified] Sukses menjalankan operasi administratif '${operationName}'.`,
      userRole: user.role,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Akses ditolak";
    return {
      success: false,
      message,
    };
  }
}
