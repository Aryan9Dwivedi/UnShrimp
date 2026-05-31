import { BRAND_IMAGES } from "../utils/brandAssets";

type ShrimpArtProps = {
  src: string;
  className?: string;
};

export function ShrimpArt({ src, className = "shrimp-art" }: ShrimpArtProps) {
  return <img className={className} src={src} alt="" aria-hidden="true" />;
}

export function ShrimpLogo({ className = "monitor-logo-image" }: { className?: string }) {
  return <ShrimpArt src={BRAND_IMAGES.logo} className={className} />;
}
