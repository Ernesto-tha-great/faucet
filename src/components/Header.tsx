import Image from "next/image";

const Header = () => {
  return (
    <header className="">
      <nav>
        <ul className="flex items-center justify-between">
          <li>
            <Image
              src="/Morph.logo_white.svg"
              alt="Morph Logo"
              className="dark:invert"
              width={100}
              height={24}
              priority
            />
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
