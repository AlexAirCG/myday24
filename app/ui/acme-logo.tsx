import { lusitana } from "./fonts";

export default function AcmeLogo() {
  return (
    <div
      className={`${lusitana.className} flex items-center justify-center leading-none text-white `}
    >
      <p className="text-[30px] md:text-[44px] ml-2 text-shadow-lg/40 hover:text-shadow-lg/50 00">
        myDay24
      </p>
    </div>
  );
}
