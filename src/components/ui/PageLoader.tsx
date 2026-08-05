'use client';

export function PageLoader() {
  return (
    <>
      <style>{`
        .page-loader-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 180px;
          height: 180px;
          font-family: "Inter", sans-serif;
          font-size: 1.2em;
          font-weight: 300;
          color: white;
          border-radius: 50%;
          background-color: transparent;
          user-select: none;
        }

        .page-loader {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          background-color: transparent;
          animation: page-loader-rotate 2s linear infinite;
          z-index: 0;
        }

        @keyframes page-loader-rotate {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 10px 20px 0 #fff inset,
              0 20px 30px 0 #ad5fff inset,
              0 60px 60px 0 #471eec inset;
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 10px 20px 0 #fff inset,
              0 20px 10px 0 #d60a47 inset,
              0 40px 60px 0 #311e80 inset;
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 10px 20px 0 #fff inset,
              0 20px 30px 0 #ad5fff inset,
              0 60px 60px 0 #471eec inset;
          }
        }

        .page-loader-letter {
          display: inline-block;
          opacity: 0.4;
          transform: translateY(0);
          animation: page-loader-letter-anim 2s infinite;
          z-index: 1;
          border-radius: 50ch;
          border: none;
        }

        .page-loader-letter:nth-child(1) { animation-delay: 0s; }
        .page-loader-letter:nth-child(2) { animation-delay: 0.1s; }
        .page-loader-letter:nth-child(3) { animation-delay: 0.2s; }
        .page-loader-letter:nth-child(4) { animation-delay: 0.3s; }
        .page-loader-letter:nth-child(5) { animation-delay: 0.4s; }
        .page-loader-letter:nth-child(6) { animation-delay: 0.5s; }
        .page-loader-letter:nth-child(7) { animation-delay: 0.6s; }

        @keyframes page-loader-letter-anim {
          0%, 100% {
            opacity: 0.4;
            transform: translateY(0);
          }
          20% {
            opacity: 1;
            transform: scale(1.15);
          }
          40% {
            opacity: 0.7;
            transform: translateY(0);
          }
        }
      `}</style>
      <div className="flex flex-col items-center gap-4">
        <div className="page-loader-wrapper">
          <span className="page-loader-letter">L</span>
          <span className="page-loader-letter">o</span>
          <span className="page-loader-letter">a</span>
          <span className="page-loader-letter">d</span>
          <span className="page-loader-letter">i</span>
          <span className="page-loader-letter">n</span>
          <span className="page-loader-letter">g</span>
          <div className="page-loader" />
        </div>
      </div>
    </>
  );
}
