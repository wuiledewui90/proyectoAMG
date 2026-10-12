export default function CatalogLoading() {
  return (
    <>
      <section className="bg-[#090b0e] px-5 pb-8 pt-24 text-white sm:px-8 sm:pb-10 sm:pt-28 lg:px-12 xl:px-16">
        <div className="mx-auto max-w-[90rem]">
          <div className="h-3 w-20 animate-pulse rounded-full bg-[#b51f30]/70" />
          <div className="mt-5 h-10 w-full max-w-3xl animate-pulse rounded-xl bg-white/10 sm:h-16" />
        </div>
      </section>
      <section className="bg-[#f4f5f7] px-5 py-10 sm:px-8 lg:px-12 lg:py-14 xl:px-16" aria-label="Cargando catálogo">
        <div className="mx-auto max-w-[90rem]">
          <div className="h-20 animate-pulse rounded-[22px] border border-white bg-white/80 shadow-sm" />
          <div className="mt-7 grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                <div className="aspect-[16/11] animate-pulse bg-slate-200" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-2/5 animate-pulse rounded bg-slate-100" />
                  <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
