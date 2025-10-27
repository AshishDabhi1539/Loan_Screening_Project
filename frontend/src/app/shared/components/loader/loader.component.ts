import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LoaderSize = 'small' | 'medium' | 'large';
export type LoaderType = 'spinner' | 'dots' | 'pulse' | 'skeleton';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent {
  @Input() isLoading = signal<boolean>(true);
  @Input() size = signal<LoaderSize>('medium');
  @Input() type = signal<LoaderType>('spinner');
  @Input() message = signal<string>('');
  @Input() overlay = signal<boolean>(false);
  @Input() color = signal<string>('primary');
  @Input() fullScreen = signal<boolean>(false);

  get loaderClasses(): string[] {
    const classes = ['loader'];
    
    if (this.overlay()) {
      classes.push('loader-overlay');
    }
    
    if (this.fullScreen()) {
      classes.push('loader-fullscreen');
    }
    
    classes.push(`loader-${this.size()}`);
    classes.push(`loader-${this.type()}`);
    classes.push(`loader-${this.color()}`);
    
    return classes;
  }

  get spinnerClasses(): string[] {
    const classes = ['spinner'];
    classes.push(`spinner-${this.size()}`);
    classes.push(`spinner-${this.color()}`);
    return classes;
  }

  get dotsClasses(): string[] {
    const classes = ['dots-loader'];
    classes.push(`dots-${this.size()}`);
    classes.push(`dots-${this.color()}`);
    return classes;
  }

  get pulseClasses(): string[] {
    const classes = ['pulse-loader'];
    classes.push(`pulse-${this.size()}`);
    classes.push(`pulse-${this.color()}`);
    return classes;
  }

  // Skeleton loader configuration
  get skeletonLines(): number[] {
    const lineCount = this.size() === 'small' ? 2 : this.size() === 'medium' ? 3 : 4;
    return Array.from({ length: lineCount }, (_, i) => i);
  }
}
