declare module 'react-native-canvas' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  interface CanvasRenderingContext2D {
    fillStyle: string;
    fillRect: (x: number, y: number, width: number, height: number) => void;
    // 根据需要添加其他 context 方法
  }

  export interface CanvasProps extends ViewProps {
    ref?: React.RefObject<Canvas>;
  }

  export default class Canvas extends Component<CanvasProps> {
    getContext(contextType: '2d'): CanvasRenderingContext2D;
  }
}