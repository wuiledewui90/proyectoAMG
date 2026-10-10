export function DesktopHeroVideo() {
  return (
    <>
      <video
        className="pointer-events-none absolute inset-0 h-full w-full bg-[#060708] object-cover object-center opacity-100 motion-reduce:hidden"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/videos/amgvideo-web.mp4" type="video/mp4" />
      </video>
      <span
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(1,8,17,.04)_0%,rgba(2,12,24,.38)_42%,rgba(2,8,16,.72)_100%)] md:hidden"
        aria-hidden="true"
      />
    </>
  )
}
