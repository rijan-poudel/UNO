import type { CSSProperties } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "dotlottie-player": {
        src?: string;
        background?: string;
        speed?: string;
        style?: CSSProperties;
        loop?: boolean;
        autoplay?: boolean;
      };
    }
  }
}

export {};
