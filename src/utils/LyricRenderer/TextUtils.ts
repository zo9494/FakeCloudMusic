import type { TextStyle } from 'pixi.js';
import { Text } from 'pixi.js';

// 文本工具类
export class TextUtils {
  private static tempText: Text | null = null;

  /**
   * 获取文本宽度
   */
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

  /**
   * 获取换行后的文本（正确处理空格和英文单词）
   */
  static getTextWrap(
    text: string,
    style: Partial<TextStyle>,
    maxWidth: number
  ): string[] {
    const result: string[] = [];

    // 如果文本宽度小于最大宽度，直接返回
    if (this.getTextWidth(text, style) <= maxWidth) {
      return [text.trim()];
    }

    // 分割文本为片段，保持英文单词完整性（包括使用英文或中文撇号的单词）
    const segments = this.splitTextIntoSegments(text);
    let currentLine = '';

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      // 如果当前行为空且片段是空格，跳过这个空格（避免行首空格）
      if (currentLine === '' && this.isWhitespace(segment)) {
        continue;
      }

      // 测试行：当前行 + 当前片段
      const testLine = currentLine + segment;
      const testWidth = this.getTextWidth(testLine, style);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        // 需要换行
        if (currentLine) {
          // 移除行尾空格
          result.push(currentLine.trim());
        }

        // 如果单个片段就超过最大宽度
        const segmentWidth = this.getTextWidth(segment, style);
        if (segmentWidth > maxWidth) {
          // 强制分割超长片段
          const splitSegments = this.breakLongSegment(segment, style, maxWidth);

          // 添加除最后一个外的所有分割部分
          for (let j = 0; j < splitSegments.length - 1; j++) {
            result.push(splitSegments[j]);
          }

          // 最后一个分割部分作为当前行
          currentLine = splitSegments[splitSegments.length - 1];
        } else {
          // 新行开始，如果片段是空格则跳过
          currentLine = this.isWhitespace(segment) ? '' : segment;
        }
      }
    }

    // 添加最后一行
    if (currentLine) {
      result.push(currentLine.trim());
    }

    return result;
  }

  /**
   * 判断片段是否全是空白字符
   */
  private static isWhitespace(segment: string): boolean {
    return /^\s+$/.test(segment);
  }

  /**
   * 将文本分割为片段，保持英文单词完整性（包括使用英文或中文撇号的单词）
   */
  private static splitTextIntoSegments(text: string): string[] {
    const segments: string[] = [];

    // 使用正则表达式匹配：
    // 1. 英文单词（包括使用英文撇号'或中文撇号’的缩写如 can't, I'm, can’t, I’m）
    // 2. 连续的非英文字符（包括中文、数字、标点等）
    // 3. 连续的空白字符
    const regex = /([a-zA-Z]+(?:['’][a-zA-Z]+)*)|([^a-zA-Z\s]+)|(\s+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        // 英文单词（包括使用英文或中文撇号的缩写）
        segments.push(match[1]);
      } else if (match[2]) {
        // 非英文字符序列（中文、数字、标点等）
        segments.push(match[2]);
      } else if (match[3]) {
        // 空白字符序列
        segments.push(match[3]);
      }
    }

    return segments;
  }

  /**
   * 分割超长片段
   */
  private static breakLongSegment(
    segment: string,
    style: Partial<TextStyle>,
    maxWidth: number
  ): string[] {
    const result: string[] = [];
    let currentPart = '';

    // 检查是否是英文单词（包括使用英文或中文撇号的缩写）
    const isEnglishWord = /^[a-zA-Z]+(?:['’][a-zA-Z]+)*$/.test(segment);

    // 如果是英文单词，尽量在合理位置分割
    if (isEnglishWord && segment.length > 3) {
      // 尝试在单词中间分割，但避免在撇号附近分割
      for (let i = 0; i < segment.length; i++) {
        const char = segment[i];
        const testPart = currentPart + char;
        const testWidth = this.getTextWidth(testPart, style);

        // 检查下一个字符是否是撇号，如果是则避免在此处分割
        const nextChar = i < segment.length - 1 ? segment[i + 1] : '';
        const isBeforeApostrophe = nextChar === "'" || nextChar === '’';

        if (testWidth <= maxWidth) {
          currentPart = testPart;
        } else {
          if (currentPart) {
            // 避免在撇号前分割
            if (isBeforeApostrophe && currentPart.length > 1) {
              // 如果下一个字符是撇号，且当前部分长度大于1，则回退一个字符
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
      // 非英文单词或短单词，按字符分割
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
