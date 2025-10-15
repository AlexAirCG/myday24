import { lusitana } from "./fonts";

export default function AcmeLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white `}
    >
      <p className="text-[30px] md:text-[44px] ml-2 text-shadow-lg/30 00">
        myDay24
      </p>
    </div>
  );
}
