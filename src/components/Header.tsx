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

          {/* <li>
            <div className="flex items-center gap-3">
              {!isConnected ? (
                <Button onClick={handleConnect}>Connect Wallet</Button>
              ) : (
                <p>{truncateAddress(address)}</p>
              )}
              <ModeToggle />
            </div>
          </li> */}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
