/** Contact form payload mirrored from POST /api/v1/contact. */
export interface ContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/** Confirmation returned once the message is persisted (never "emailed"). */
export interface ContactMessageResult {
  id: string;
  name: string;
  subject: string;
  message: string;
  createdAt: string;
}

export type ContactStatus = 'OPEN' | 'RESOLVED';

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  OPEN: 'Pendiente',
  RESOLVED: 'Atendido',
};

export function contactStatusClass(status: ContactStatus): string {
  return status === 'RESOLVED'
    ? 'border-emerald-700/60 bg-emerald-950/50 text-emerald-300'
    : 'border-amber-800/60 bg-amber-950/50 text-amber-300';
}

/**
 * Staff inbox shape from GET /api/v1/contacts — the full message plus the
 * operator reply fields. Mirrors the backend `AdminContactMessage` DTO.
 */
export interface StaffContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  reply: string | null;
  repliedAt: string | null;
  repliedBy: string | null;
  createdAt: string;
}
