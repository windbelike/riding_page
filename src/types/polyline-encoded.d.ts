declare module 'polyline-encoded' {
  interface Polyline {
    decode(str: string, precision?: number): number[][];
    encode(coordinates: number[][], precision?: number): string;
  }

  const polyline: Polyline;
  export default polyline;
}

