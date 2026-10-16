import { ChangeDetectionStrategy, Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { LucideCheck, LucideCircleAlert, LucideFileText, LucideUpload } from '@lucide/angular';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { UploadTask } from './upload-task.model';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = new Set(['pdf', 'docx', 'txt']);

@Component({
  selector: 'app-document-upload',
  imports: [ButtonComponent, FileSizePipe, LucideCheck, LucideCircleAlert, LucideFileText, LucideUpload],
  template: `
    <section
      class="upload"
      [class.upload--dragging]="dragging()"
      aria-labelledby="upload-heading"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="browseOnZoneClick($event)"
    >
      <input
        #fileInput
        class="upload__input"
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        multiple
        aria-label="Choose PDF, DOCX, or TXT files to upload"
        (change)="onFilesChosen($event)"
      />
      <div class="upload__prompt">
        <span class="upload__icon" aria-hidden="true"><svg lucideUpload [size]="22"></svg></span>
        <h2 id="upload-heading">Drop documents here to upload</h2>
        <p>PDF, DOCX, or TXT · Up to 20 MB per file</p>
        <app-button variant="secondary" (click)="fileInput.click()">Browse files</app-button>
      </div>
    </section>

    @if (errors().length > 0) {
      <div class="upload-errors" role="alert" aria-live="polite">
        @for (error of errors(); track $index) {
          <p>{{ error }}</p>
        }
      </div>
    }

    @if (tasks().length > 0) {
      <section class="upload-queue" aria-label="Upload progress">
        <div class="upload-queue__header">
          <h2>Recent uploads</h2>
          <button class="upload-queue__clear" type="button" (click)="clearCompleted()">
            Clear completed
          </button>
        </div>
        @for (task of tasks(); track task.id) {
          <article class="upload-row">
            <span class="upload-row__icon" aria-hidden="true">
              @switch (task.state) {
                @case ('success') {
                  <svg lucideCheck [size]="17"></svg>
                }
                @case ('failed') {
                  <svg lucideCircleAlert [size]="17"></svg>
                }
                @default {
                  <svg lucideFileText [size]="17"></svg>
                }
              }
            </span>
            <div class="upload-row__main">
              <div class="upload-row__meta">
                <span class="upload-row__name">{{ task.fileName }}</span>
                <span class="upload-row__size">{{ task.sizeBytes | fileSize }}</span>
              </div>
              @if (task.state === 'uploading') {
                <div
                  class="upload-progress"
                  role="progressbar"
                  [attr.aria-label]="'Uploading ' + task.fileName"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  [attr.aria-valuenow]="task.progress"
                >
                  <span class="upload-progress__value" [style.width.%]="task.progress"></span>
                </div>
                <span class="upload-row__status">Uploading · {{ task.progress }}%</span>
              } @else {
                <span
                  class="upload-row__status"
                  [class.upload-row__status--success]="task.state === 'success'"
                  [class.upload-row__status--failed]="task.state === 'failed'"
                >
                  {{ task.state === 'success' ? 'Uploaded successfully' : task.errorMessage }}
                </span>
              }
            </div>
          </article>
        }
      </section>
    }
  `,
  styleUrl: './document-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentUploadComponent {
  readonly tasks = input<readonly UploadTask[]>([]);
  readonly filesSelected = output<readonly File[]>();
  protected readonly dragging = signal(false);
  protected readonly errors = signal<readonly string[]>([]);
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  browse(): void {
    this.fileInput().nativeElement.click();
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    const relatedTarget = event.relatedTarget;
    const currentTarget = event.currentTarget;
    if (!(relatedTarget instanceof Node) || !(currentTarget instanceof Element) || !currentTarget.contains(relatedTarget)) {
      this.dragging.set(false);
    }
  }

  protected browseOnZoneClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('button, input')) {
      this.browse();
    }
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.processFiles(files);
  }

  protected onFilesChosen(event: Event): void {
    const inputElement = event.target;
    if (!(inputElement instanceof HTMLInputElement)) {
      return;
    }
    this.processFiles(Array.from(inputElement.files ?? []));
    inputElement.value = '';
  }

  protected clearCompleted(): void {
    const activeTaskIds = new Set(
      this.tasks().filter((task) => task.state === 'uploading').map((task) => task.id),
    );
    this.cleared.emit(activeTaskIds);
  }

  readonly cleared = output<ReadonlySet<string>>();

  private processFiles(files: readonly File[]): void {
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!ACCEPTED_EXTENSIONS.has(extension)) {
        errors.push(`${file.name}: unsupported file type. Choose a PDF, DOCX, or TXT file.`);
      } else if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: file exceeds the 20 MB limit.`);
      } else {
        validFiles.push(file);
      }
    }

    this.errors.set(errors);
    if (validFiles.length > 0) {
      this.filesSelected.emit(validFiles);
    }
  }
}
