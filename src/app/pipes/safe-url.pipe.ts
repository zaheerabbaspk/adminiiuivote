import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Pipe({
    name: 'safeUrl',
    standalone: true
})
export class SafeUrlPipe implements PipeTransform {
    private sanitizer = inject(DomSanitizer);

    transform(url: string | undefined): SafeUrl | string {
        if (!url) return '';
        if (url.startsWith('data:')) {
            return this.sanitizer.bypassSecurityTrustUrl(url);
        }
        return url;
    }
}
