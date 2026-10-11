import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';

import { ContactService } from '../../../core/services/contact.service';
import { ToastService } from '../../../core/services/toast.service';
import type { ContactStatus, StaffContactMessage } from '../../../core/models/contact.model';
import { CONTACT_STATUS_LABELS, contactStatusClass } from '../../../core/models/contact.model';

/** Staff inbox: read contact submissions and record a reply. */
@Component({
  selector: 'app-contacts-inbox',
  templateUrl: './contacts-inbox.html',
  imports: [DatePipe],
})
export class ContactsInboxComponent {
  private readonly contacts = inject(ContactService);
  private readonly toasts = inject(ToastService);

  protected readonly messages = signal<StaffContactMessage[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly statusFilter = signal<'' | ContactStatus>('');

  protected readonly activeId = signal<string | null>(null);
  protected readonly replyText = signal('');
  protected readonly sending = signal(false);

  protected readonly statusLabels = CONTACT_STATUS_LABELS;
  protected readonly statusClass = contactStatusClass;

  protected readonly filtered = computed(() => {
    const filter = this.statusFilter();
    const all = this.messages();
    return filter ? all.filter((message) => message.status === filter) : all;
  });

  protected readonly openCount = computed(
    () => this.messages().filter((message) => message.status === 'OPEN').length,
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.contacts.list().subscribe({
      next: (messages) => {
        this.messages.set(messages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los mensajes.');
        this.loading.set(false);
      },
    });
  }

  protected onStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value as '' | ContactStatus);
  }

  protected openReply(message: StaffContactMessage): void {
    this.activeId.set(message.id);
    this.replyText.set('');
  }

  protected cancelReply(): void {
    this.activeId.set(null);
    this.replyText.set('');
  }

  protected onReplyInput(event: Event): void {
    this.replyText.set((event.target as HTMLTextAreaElement).value);
  }

  protected sendReply(message: StaffContactMessage): void {
    const reply = this.replyText().trim();
    if (!reply) {
      this.toasts.show('Escribe una respuesta', 'error');
      return;
    }

    this.sending.set(true);
    this.contacts.reply(message.id, reply).subscribe({
      next: (updated) => {
        this.sending.set(false);
        this.activeId.set(null);
        this.replyText.set('');
        this.messages.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.toasts.show('Respuesta registrada', 'success');
      },
      error: (error: unknown) => {
        this.sending.set(false);
        this.toasts.show(messageFrom(error), 'error');
      },
    });
  }
}

function messageFrom(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { error?: { message?: string } } | null;
    return body?.error?.message ?? `Error ${error.status}`;
  }
  return 'Error inesperado';
}
