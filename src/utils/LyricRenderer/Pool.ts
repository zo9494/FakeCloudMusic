import { Container, Graphics, Text } from 'pixi.js';
//
export abstract class BasePool {}

export class GraphicsPool extends BasePool {}

export class TextPool extends BasePool {}
export class ContainerPool extends BasePool {}
