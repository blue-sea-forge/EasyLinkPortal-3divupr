import type { HeaderLogos } from "../config/portalConfig";

interface HeaderProps {
  name: string;
  /** Shown on the left when `logos` has no left image. */
  logoUrl: string;
  logos?: HeaderLogos;
}

export function Header({ name, logoUrl, logos }: HeaderProps) {
  const leftLogo = logos?.left ?? logoUrl;

  return (
    <header className="header">
      <div className="header-slot header-slot-left">
        <img className="header-logo" src={leftLogo} alt="" />
      </div>
      <div className="header-slot header-slot-middle">
        {logos?.middle && <img className="header-logo" src={logos.middle} alt="" />}
        <span className="header-title">{name}</span>
      </div>
      <div className="header-slot header-slot-right">
        {logos?.right && <img className="header-logo" src={logos.right} alt="" />}
      </div>
    </header>
  );
}
