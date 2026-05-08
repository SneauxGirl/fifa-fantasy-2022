import { useId } from "react";
import type { SVGProps } from "react";

export type SoccerBallIconProps = SVGProps<SVGSVGElement>;

/**
 * Soccer ball mark for bullets, tickers, and badges.
 * Vector source: `src/assets/soccer-ball.svg`
 */
export function SoccerBallIcon({ className, ...rest }: SoccerBallIconProps) {
  const uid = useId().replace(/:/g, "");
  const clipId = `sb-${uid}-clip`;
  const grad1 = `sb-${uid}-g1`;
  const grad2 = `sb-${uid}-g2`;
  const blackId = `sb-${uid}-black`;

  return (
    <svg
      viewBox="-105 -105 210 210"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...rest}
    >
      <defs>
        <clipPath id={clipId}>
          <circle r={100} strokeWidth={0} />
        </clipPath>
        <radialGradient id={grad1} cx=".4" cy=".3" r=".8">
          <stop offset="0" stopColor="white" stopOpacity={1} />
          <stop offset=".4" stopColor="white" stopOpacity={1} />
          <stop offset=".8" stopColor="#EEEEEE" stopOpacity={1} />
        </radialGradient>
        <radialGradient id={grad2} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="white" stopOpacity={0} />
          <stop offset=".8" stopColor="white" stopOpacity={0} />
          <stop offset=".99" stopColor="black" stopOpacity={0.3} />
          <stop offset="1" stopColor="black" stopOpacity={1} />
        </radialGradient>
        <g id={blackId} strokeLinejoin="round" clipPath={`url(#${clipId})`}>
          <g fill="black">
            <path d="M 6,-32 Q 26,-28 46,-19 Q 57,-35 64,-47 Q 50,-68 37,-76 Q 17,-75 1,-68 Q 4,-51 6,-32" />
            <path d="M -26,-2 Q -45,-8 -62,-11 Q -74,5 -76,22 Q -69,40 -50,54 Q -32,47 -17,39 Q -23,15 -26,-2" />
            <path d="M -95,22 Q -102,12 -102,-8 V 80 H -85 Q -95,45 -95,22" />
            <path d="M 55,24 Q 41,41 24,52 Q 28,65 31,79 Q 55,78 68,67 Q 78,50 80,35 Q 65,28 55,24" />
            <path d="M 0,120 L -3,95 Q -25,93 -42,82 Q -50,84 -60,81" />
            <path d="M -90,-48 Q -80,-52 -68,-49 Q -52,-71 -35,-77 Q -35,-100 -40,-100 H -100" />
            <path d="M 100,-55 L 87,-37 Q 98,-10 97,5 L 100,6" />
          </g>
          <g fill="none">
            <path d="M 6,-32 Q -18,-12 -26,-2 M 46,-19 Q 54,5 55,24 M 64,-47 Q 77,-44 87,-37 M 37,-76 Q 39,-90 36,-100 M 1,-68 Q -13,-77 -35,-77 M -62,-11 Q -67,-25 -68,-49 M -76,22 Q -85,24 -95,22 M -50,54 Q -49,70 -42,82 M -17,39 Q 0,48 24,52 M 31,79 Q 20,92 -3,95 M 68,67 L 80,80 M 80,35 Q 90,25 97,5" />
          </g>
        </g>
      </defs>
      <circle r={100} fill="white" stroke="none" />
      <circle r={100} fill={`url(#${grad1})`} stroke="none" />
      <use href={`#${blackId}`} stroke="#EEE" strokeWidth={7} />
      <use href={`#${blackId}`} stroke="#DDD" strokeWidth={4} />
      <use href={`#${blackId}`} stroke="#999" strokeWidth={2} />
      <use href={`#${blackId}`} stroke="black" strokeWidth={1} />
      <circle r={100} fill={`url(#${grad2})`} stroke="none" />
    </svg>
  );
}
