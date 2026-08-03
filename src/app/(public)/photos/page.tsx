const PHOTO_URLS = [
  "https://lh3.googleusercontent.com/sitesv/AG8ngQV3ez2rl1IdOOrj46RkLfDFJx3vTG_7w51vD_7mn9UNWX_LDDdP03xd9koxCqPxlXnXIPAMcEfgeBZx7YBrvDvhjb-66p4UwXNQ2HcSGYeJOEUuGH8Bcg0JGQyTL7DQ4f73SWWbPedQDELnLMhulH8q8YBpBeBrOwTfPlFhkSxcLdrPfeMGR0LIHykh9Kw=w16383",
  "https://lh3.googleusercontent.com/sitesv/AG8ngQX8OB2IKo0LT4dl92aBCrx3h2OqdBlL6nhNQWR_jWAJmDNvkCopyd_5M2f3sJXz2GwoW-Xf0fK9B70sJrfzxrwf3gHjOJrCN3PRZVL6pGpgCRSL2usLvBzVjQnhWsTB4c8fIKIlz4bamr8290pk-dOKUQL5o2UZ1k9SOgP6HG4OhLoEm3_93ek787-E0w_mXDlVQAcp-BQPyFvWNHAqjuQYlgNPSFkYAFlWxwJO=w1280",
  "https://lh3.googleusercontent.com/sitesv/AG8ngQWsiyjTFdYEOWsWDvLtCK_dOaDLIKOo580jj6HKsurMo7pIPbWBjyKGOJD8FOTgJkGpRjefJ9GFRUYcAKFrLqezvO3xERsEJzIVMTwWmXW-9icWLkGGY8UWQufMDwqD8T5Dy9P3jPs6rtDBpee5ykr9qu4g-6Qm4AFCPf_73k_TwStF82qO4yHXHz0QzoIkl49T51KSfDmMpeFenI8cI_M3dKD80E9kddsZOTYK=w1280",
];

export default function PhotosPage() {
  return (
    <div className="bg-[#f8f9fc] px-6 py-16 sm:px-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-center text-4xl font-bold text-[#013594] sm:text-5xl">Photo Gallery</h1>
        <p className="mx-auto mt-4 max-w-3xl text-center text-[15px] leading-8 text-zinc-600">
          Moments from chapter service projects, fellowship, and community impact.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PHOTO_URLS.map((url, index) => (
            <figure key={url} className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Tau Sigma chapter photo ${index + 1}`}
                className="h-64 w-full object-cover"
                loading="lazy"
              />
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
