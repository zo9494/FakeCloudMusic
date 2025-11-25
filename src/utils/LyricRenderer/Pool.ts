import { Container, ContainerChild, Graphics, Text } from 'pixi.js';

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

export class GraphicsPool extends BasePool<Graphics> {
  protected create(): Graphics {
    throw new Error('Method not implemented.');
  }
  protected reset(item: Graphics): void {
    throw new Error('Method not implemented.');
  }
}

export class TextPool extends BasePool<Text> {
  protected create(): Text {
    throw new Error('Method not implemented.');
  }
  protected reset(item: Text): void {
    throw new Error('Method not implemented.');
  }
}
export class ContainerPool extends BasePool<Container> {
  protected create(): Container<ContainerChild> {
    throw new Error('Method not implemented.');
  }
  protected reset(item: Container<ContainerChild>): void {
    throw new Error('Method not implemented.');
  }
}
