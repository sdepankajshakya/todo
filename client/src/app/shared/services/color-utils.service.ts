import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColorUtilsService {
  lightOrDark(color: string): 'light' | 'dark' {
    let r = 0, g = 0, b = 0;

    if (color.match(/^rgb/)) {
      const result = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (result) {
        r = +result[1];
        g = +result[2];
        b = +result[3];
      } else {
        // fallback to default light or dark
        return 'light';
      }
    } else {
      const hex = color.replace('#', '');
      if (hex.length === 3) {
        // e.g. #abc → aabbcc
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      } else {
        // fallback if invalid format
        return 'light';
      }
    }

    const hsp = Math.sqrt(
      0.299 * (r * r) +
      0.587 * (g * g) +
      0.114 * (b * b)
    );

    return hsp > 127.5 ? 'light' : 'dark';
  }
}
