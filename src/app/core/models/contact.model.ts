// Payload del formulario de contacto copiado de POST /api/v1/contact.
export interface ContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Confirmación devuelta cuando el mensaje se persiste (nunca se "envía por email").
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

// Forma de la bandeja de staff de GET /api/v1/contacts; mensaje completo más campos de respuesta del operador.
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
