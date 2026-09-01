import type { CSSProperties } from "react";

interface Props {
  className?: string;
  style?: CSSProperties;
  alt?: string;
}

// The Varenis mark is the snow-leopard artwork itself. It's always shown in
// its natural graphite tones — placements that sit on the dark UI give it a
// light "paper" tile backing (see the __frame / __mark CSS) so it reads like
// the leopard printed on a garment tag, rather than being recolored.
export function LeopardMark({ className, style, alt = "" }: Props) {
  return (
    <img
      className={className}
      style={style}
      src="/leopard/leopard_stand.png"
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      draggable={false}
    />
  );
}
