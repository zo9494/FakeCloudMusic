import { Container, Graphics, Text } from 'pixi.js';

export abstract class BasePool<T> {
  private pool: T[] = [];

  constructor() {
    this.pool = [];
  }
  public get(): T {
    return this.pool.pop() || this.create();
  }

  public release(item: T): void {
    this.reset(item);
    this.pool.push(item);
  }

  protected abstract create(): T;

  protected abstract reset(item: T): void;
}

export class GraphicsPool extends BasePool<Graphics> {}

export class TextPool extends BasePool<Text> {}
export class ContainerPool extends BasePool<Container> {}
