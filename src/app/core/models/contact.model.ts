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