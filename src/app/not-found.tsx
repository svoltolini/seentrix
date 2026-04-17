import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Center content — positioned in upper area to match design */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-[22vh] text-center">
        <h1 className="text-[80px] font-bold leading-none sm:text-[110px] sm:leading-[110px]">
          <span className="text-foreground">4</span>
          <span className="text-primary">0</span>
          <span className="text-foreground">4</span>
        </h1>

        <p className="mt-[18px] max-w-[570px] text-base leading-[30px] text-muted-foreground sm:text-lg">
          Sorry, the page you&apos;re looking for doesn&apos;t exist. If you
          think something is broken, report a problem.
        </p>

        <Link href="/" className="mt-[38px] inline-flex items-center justify-center rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]">
          Go To Home
        </Link>
      </div>

      {/* Bottom-left plug illustration */}
      <div className="pointer-events-none absolute bottom-0 left-[-18px] w-[300px] select-none sm:w-[400px] lg:w-[533px]">
        <Image
          src="/images/404-plug.png"
          alt=""
          width={533}
          height={424}
          className="h-auto w-full"
          priority
        />
      </div>

      {/* Bottom-right socket illustration */}
      <div className="pointer-events-none absolute bottom-0 right-[-50px] w-[350px] select-none sm:w-[500px] lg:right-[-20px] lg:w-[714px]">
        <Image
          src="/images/404-socket.png"
          alt=""
          width={714}
          height={342}
          className="h-auto w-full"
          priority
        />
      </div>
    </div>
  );
}
