import type { TextStyle } from 'pixi.js';
import { Text } from 'pixi.js';

const ENGLISH_WORD_REGEX = /^[a-zA-Z]+(?:[''][a-zA-Z]+)*/;

export class TextUtils {
  private static tempText: Text | null = null;

  static getTextWidth(text: string = '', style: Partial<TextStyle>): number {
    if (!TextUtils.tempText) {
      TextUtils.tempText = new Text({
        text,
        style,
      });
      TextUtils.tempText.visible = false;
    }

    TextUtils.tempText.text = text;
    return TextUtils.tempText.width;
  }

  static getTextWrap(
    text: string,
    style: Partial<TextStyle>,
    maxWidth: number
  ): string[] {
    const result: string[] = [];

    if (this.getTextWidth(text, style) <= maxWidth) {
      return [text.trim()];
    }

    const segments = this.splitTextIntoSegments(text);
    let currentLine = '';

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (currentLine === '' && this.isWhitespace(segment)) {
        continue;
      }

      const testLine = currentLine + segment;
      const testWidth = this.getTextWidth(testLine, style);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          result.push(currentLine.trim());
        }

        const segmentWidth = this.getTextWidth(segment, style);
        if (segmentWidth > maxWidth) {
          const splitSegments = this.breakLongSegment(segment, style, maxWidth);

          for (let j = 0; j < splitSegments.length - 1; j++) {
            result.push(splitSegments[j]);
          }

          currentLine = splitSegments[splitSegments.length - 1];
        } else {
          currentLine = this.isWhitespace(segment) ? '' : segment;
        }
      }
    }

    if (currentLine) {
      result.push(currentLine.trim());
    }

    return result;
  }

  private static isWhitespace(segment: string): boolean {
    return /^\s+$/.test(segment);
  }

  static isEnglishWord(text: string): boolean {
    return ENGLISH_WORD_REGEX.test(text);
  }

  private static splitTextIntoSegments(text: string): string[] {
    const segments: string[] = [];
    let i = 0;

    while (i < text.length) {
      const char = text[i];

      if (/[a-zA-Z]/.test(char)) {
        const wordMatch = text.slice(i).match(ENGLISH_WORD_REGEX);
        if (wordMatch) {
          segments.push(wordMatch[0]);
          i += wordMatch[0].length;
          continue;
        }
      }

      if (/\s/.test(char)) {
        const spaceMatch = text.slice(i).match(/^\s+/);
        if (spaceMatch) {
          segments.push(spaceMatch[0]);
          i += spaceMatch[0].length;
          continue;
        }
      }

      segments.push(char);
      i++;
    }

    return segments;
  }

  private static breakLongSegment(
    segment: string,
    style: Partial<TextStyle>,
    maxWidth: number
  ): string[] {
    const result: string[] = [];
    let currentPart = '';

    const isEnglish = this.isEnglishWord(segment);

    if (isEnglish && segment.length > 3) {
      for (let i = 0; i < segment.length; i++) {
        const char = segment[i];
        const testPart = currentPart + char;
        const testWidth = this.getTextWidth(testPart, style);

        const nextChar = i < segment.length - 1 ? segment[i + 1] : '';
        const isBeforeApostrophe = nextChar === "'" || nextChar === '’';

        if (testWidth <= maxWidth) {
          currentPart = testPart;
        } else {
          if (currentPart) {
            if (isBeforeApostrophe && currentPart.length > 1) {
              const lastChar = currentPart[currentPart.length - 1];
              result.push(currentPart.slice(0, -1));
              currentPart = lastChar + char;
            } else {
              result.push(currentPart);
              currentPart = char;
            }
          } else {
            currentPart = char;
          }
        }
      }
    } else {
      for (let i = 0; i < segment.length; i++) {
        const char = segment[i];
        const testPart = currentPart + char;
        const testWidth = this.getTextWidth(testPart, style);

        if (testWidth <= maxWidth) {
          currentPart = testPart;
        } else {
          if (currentPart) {
            result.push(currentPart);
          }
          currentPart = char;
        }
      }
    }

    if (currentPart) {
      result.push(currentPart);
    }

    return result;
  }
}