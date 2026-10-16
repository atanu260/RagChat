import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideBookOpen, LucideChevronDown, LucideExternalLink } from '@lucide/angular';
import { CitationDto } from '../../core/models/citation.models';

@Component({
  selector: 'app-citation-panel',
  imports: [LucideBookOpen, LucideChevronDown, LucideExternalLink, RouterLink],
  template: `
    <aside class="citation-panel" aria-label="Answer sources">
      <header class="citation-panel__header">
        <div>
          <p class="citation-panel__eyebrow">Answer sources</p>
          <h2>{{ citations().length }} {{ citations().length === 1 ? 'source' : 'sources' }}</h2>
        </div>
        <button class="icon-button" type="button" aria-label="Close sources panel" (click)="close.emit()">×</button>
      </header>

      @if (citations().length === 0) {
        <div class="citation-empty">
          <svg lucideBookOpen [size]="22"></svg>
          <p>No sources were returned for this answer.</p>
        </div>
      } @else {
        <div class="citation-list">
          @for (citation of citations(); track citation.chunkId; let index = $index) {
            <details class="citation" [class.citation--highlighted]="highlightedIndex() === index" [open]="highlightedIndex() === index">
              <summary (click)="selectCitation(index)">
                <span class="citation__number">{{ index + 1 }}</span>
                <span class="citation__heading">
                  <span class="citation__name">{{ citation.documentName }}</span>
                  <span class="citation__page">
                    {{ citation.pageNumber === null ? 'Source excerpt' : 'Page ' + citation.pageNumber }}
                  </span>
                </span>
                <svg class="citation__chevron" lucideChevronDown [size]="16"></svg>
              </summary>
              <div class="citation__body">
                <div class="relevance">
                  <span>Relevance</span>
                  <span>{{ relevance(citation.score) }}%</span>
                </div>
                <div
                  class="relevance__track"
                  role="progressbar"
                  aria-label="Source relevance"
                  [attr.aria-valuenow]="relevance(citation.score)"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <span [style.width.%]="relevance(citation.score)"></span>
                </div>
                <p class="citation__excerpt">{{ citation.content }}</p>
                <a class="citation__document-link" [routerLink]="['/documents', citation.documentId]">
                  <svg lucideExternalLink [size]="14"></svg>
                  View document
                </a>
              </div>
            </details>
          }
        </div>
      }
    </aside>
  `,
  styleUrl: './citation-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CitationPanelComponent {
  readonly citations = input<readonly CitationDto[]>([]);
  readonly highlightedIndex = input<number | null>(null);
  readonly close = output<void>();
  readonly citationSelected = output<number>();

  protected relevance(score: number): number {
    return Math.round(Math.max(0, Math.min(1, score)) * 100);
  }

  protected selectCitation(index: number): void {
    this.citationSelected.emit(index);
  }
}
