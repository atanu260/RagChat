import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { RouterLink } from '@angular/router';
import {
  LucideEllipsis,
  LucideEye,
  LucideFileText,
  LucideFileType,
  LucideRefreshCw,
  LucideTrash,
} from '@lucide/angular';
import { DocumentDto } from '../../core/models/document.models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { StatusBadgeComponent } from './status-badge.component';

@Component({
  selector: 'app-document-list',
  imports: [
    CdkMenu,
    CdkMenuItem,
    CdkMenuTrigger,
    EmptyStateComponent,
    FileSizePipe,
    LucideEllipsis,
    LucideEye,
    LucideFileText,
    LucideFileType,
    LucideRefreshCw,
    LucideTrash,
    RelativeTimePipe,
    RouterLink,
    SkeletonComponent,
    StatusBadgeComponent,
  ],
  template: `
    @if (loading()) {
      <div class="document-grid" aria-label="Loading documents" aria-busy="true">
        @for (item of skeletonItems; track item) {
          <article class="document-card document-card--skeleton">
            <app-skeleton variant="circle" width="40px" height="40px" />
            <div class="document-card__skeleton-details">
              <app-skeleton width="64%" height="0.875rem" />
              <app-skeleton width="42%" height="0.6875rem" />
            </div>
            <app-skeleton width="76px" height="1.375rem" />
          </article>
        }
      </div>
    } @else if (documents().length === 0) {
      <section class="empty-panel">
        <app-empty-state
          title="No documents yet"
          description="Upload your first file to start asking questions about your documents."
          [icon]="fileIcon"
        />
      </section>
    } @else {
      <div class="document-grid" aria-label="Your documents">
        @for (document of documents(); track document.id) {
          <article class="document-card">
            <span class="document-card__icon" aria-hidden="true">
              @if (fileExtension(document.fileName) === 'docx') {
                <svg lucideFileType [size]="19"></svg>
              } @else {
                <svg lucideFileText [size]="19"></svg>
              }
            </span>
            <div class="document-card__details">
              <h2 [title]="document.fileName">{{ document.fileName }}</h2>
              <p>
                <span>{{ document.sizeBytes | fileSize }}</span>
                <span aria-hidden="true">·</span>
                <time [attr.datetime]="document.createdAt">{{ document.createdAt | relativeTime }}</time>
                @if (document.pageCount !== null) {
                  <span aria-hidden="true">·</span>
                  <span>{{ document.pageCount }} {{ document.pageCount === 1 ? 'page' : 'pages' }}</span>
                }
              </p>
              @if (document.status === 'Failed' && document.errorMessage) {
                <p class="document-card__error">{{ document.errorMessage }}</p>
              }
            </div>
            <app-document-status [status]="document.status" [errorMessage]="document.errorMessage" />
            <button
              class="document-actions-trigger"
              type="button"
              [attr.aria-label]="'Actions for ' + document.fileName"
              [cdkMenuTriggerFor]="actionsMenu"
              [cdkMenuTriggerData]="{ document: document }"
            >
              <svg lucideEllipsis [size]="19"></svg>
            </button>
          </article>
        }
      </div>
    }

    <ng-template #actionsMenu let-document="document">
      <div class="document-menu" cdkMenu>
        <a class="document-menu__item" [routerLink]="['/documents', document.id]" cdkMenuItem>
          <svg lucideEye [size]="16"></svg>
          <span>View details</span>
        </a>
        @if (document.status === 'Ready' || document.status === 'Failed') {
          <button class="document-menu__item" type="button" cdkMenuItem (click)="reindexRequested.emit(document)">
            <svg lucideRefreshCw [size]="16"></svg>
            <span>Reindex</span>
          </button>
        }
        <button class="document-menu__item document-menu__item--danger" type="button" cdkMenuItem (click)="deleteRequested.emit(document)">
          <svg lucideTrash [size]="16"></svg>
          <span>Delete</span>
        </button>
      </div>
    </ng-template>
  `,
  styleUrl: './document-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentListComponent {
  readonly documents = input<readonly DocumentDto[]>([]);
  readonly loading = input(false);
  readonly reindexRequested = output<DocumentDto>();
  readonly deleteRequested = output<DocumentDto>();

  protected readonly fileIcon = LucideFileText;
  protected readonly skeletonItems = [1, 2, 3, 4, 5, 6];

  protected fileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() ?? '';
  }
}
