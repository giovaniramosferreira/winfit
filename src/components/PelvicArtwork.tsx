/** A resting breath, rather than a depiction of a pelvic-floor contraction. */
export default function PelvicArtwork() {
  return <div className="home-module-art home-module-art-pelvic" aria-hidden="true">
    <span className="home-art-orbit" />
    <svg viewBox="0 0 240 220" fill="none" stroke="#302936" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <pattern id="pelvic-ink" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><path d="M0 0v5" stroke="#403847" strokeWidth=".65" /></pattern>
      </defs>
      <ellipse cx="121" cy="192" rx="74" ry="5" fill="#766384" opacity=".09" stroke="none" />
      {/* Relaxed, clothed figure, seated with hands resting on the thighs. */}
      <path d="M110 49c-3-11 1-23 13-26 13-3 23 5 23 18l-2 11-4 8-8 5-10-3-6-7-6-6Z" fill="#fbf8f1" />
      <path d="M111 43c-3-12 3-21 14-22 12-2 23 6 23 18l-3 9-4-1-3-14c-9 4-17 5-27 3" fill="url(#pelvic-ink)" />
      <path d="m140 46 4 5-5 2m-14-8 5 1m-6-2 3-1m8 14-6 1m-14-15c-5-5-7 4-2 8m10 12-2 9m16-10 1 10" />
      <path d="M121 70c-12 0-21 9-23 24l-3 37c10 9 35 12 49 4l-3-34c-1-16-3-26-12-30l-8-1Z" fill="#faf8f2" />
      <path d="M109 76c7 10 20 13 29 3m-37 24 8 5m27-13-6 12m-28 13 7 3m26-9 4 12m-29-36c-2 15-3 27 0 38m12-40-1 37m6-35 1 16" strokeWidth=".8" />
      <path d="M105 80c-8-3-13 5-15 17l-7 28-16 23c-3 5-1 9 4 9 4 0 8-3 11-6l18-22 10-30c3-10 2-16-5-19Z" fill="#fbf8f1" />
      <path d="m98 91-4 18-5 18m-2 3-13 21m-2-2-3 6m6-5-2 6m4-7-1 5m22-64 3-4m-8 20 5 1m-11 20 5 2" strokeWidth=".8" />
      <path d="M137 82c6-2 12 5 14 15l5 27 21 23c4 4 3 9-2 10-4 1-9-2-13-6l-21-21-9-30c-3-10-1-16 5-18Z" fill="#fbf8f1" />
      <path d="m141 91 7 35 21 24m-1-3 4 8m1-7 3 7m-30-36-5 2m7 5-4 3" strokeWidth=".8" />
      <path d="M97 132c-12 5-28 17-43 29-13 11-9 25 8 28 16 3 40-4 62-14 24 10 47 17 62 13 15-4 16-16 3-26l-44-29c-13 6-32 7-48-1Z" fill="url(#pelvic-ink)" />
      <path d="m72 160 33 10-33 13m91-23-39 15m-20-6 17-10 19-5m-18 22 23 9m-47-40 13 10m20-14-6 13" />
      <path d="M69 178c-10-3-17 0-17 5 0 6 9 8 19 6l22-6-2-8-22 3Zm94-2c12-1 22 2 22 7 0 5-8 8-19 5l-18-6 1-8 14 2Z" fill="#fbf8f1" />
      <path d="m57 182 9 1m-6 2 9 1m107-5-8 2m10 1-9 2" strokeWidth=".75" />
    </svg>
  </div>
}
