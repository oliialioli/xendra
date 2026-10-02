import { forwardRef, type ReactElement } from 'react';
import { IconBase, type Icon, type IconWeight } from '@phosphor-icons/react';

/**
 * The map's own landmarks drawn as icons, where a stock Phosphor icon
 * wouldn't look like the real thing. Same 256-unit grid and API as
 * Phosphor's (IconBase), so they work anywhere a Phosphor icon does: the
 * map badges use `fill`, the menu and panel headers the default `regular`.
 * Other weights fall back to `regular`.
 */
function weightsOf(regular: ReactElement, fill: ReactElement): Map<IconWeight, ReactElement> {
  return new Map<IconWeight, ReactElement>([
    ['regular', regular],
    ['fill', fill],
    ['bold', regular],
    ['light', regular],
    ['thin', regular],
    ['duotone', regular],
  ]);
}

type IconProps = React.ComponentProps<Icon>;

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 16,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** The ruined castle on the hill: a tall broken tower with a window, a low crenellated wall and a fallen stone. */
const CASTLE_RUIN = weightsOf(
  <>
    <path {...stroke} d="M136,216V64h16V44h20V64h12V36h20V216" />
    <path {...stroke} d="M136,148H106V126H88v14H72V122H54v18H36v76" />
    <path {...stroke} d="M158,144V116a10,10,0,0,1,20,0v28Z" />
    <path {...stroke} d="M214,216V198h22v18" />
    <path {...stroke} d="M20,216H240" />
  </>,
  <>
    <path fillRule="evenodd" d="M132,228V60h16V40h28V60h4V32h28V228ZM154,148h28V114a14,14,0,0,0-28,0Z" />
    <path d="M32,228V136H50V118H76v18h8V122h26v22h26v84Z" />
    <path d="M210,228V194h30v34Z" />
  </>,
);

export const CastleRuinIcon: Icon = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props} weights={CASTLE_RUIN} />
));
CastleRuinIcon.displayName = 'CastleRuinIcon';

/** The little steam train by the campfire: cab, boiler, chimney, wheels and a puff of smoke. */
const STEAM_TRAIN = weightsOf(
  <>
    <path {...stroke} d="M28,72H108" />
    <path {...stroke} d="M44,176V72M92,176V72" />
    <rect {...stroke} x="58" y="92" width="20" height="26" rx="4" />
    <rect {...stroke} x="96" y="110" width="110" height="52" rx="14" />
    <path {...stroke} d="M168,110V80M186,110V80M158,78h38" />
    <path {...stroke} d="M30,178H214l14,18" />
    <circle {...stroke} cx="70" cy="200" r="18" />
    <circle {...stroke} cx="142" cy="204" r="14" />
    <circle {...stroke} cx="186" cy="204" r="14" />
    <circle {...stroke} cx="208" cy="48" r="10" />
    <circle {...stroke} cx="232" cy="26" r="6" />
  </>,
  <>
    <path d="M20,64h96V80H100v90H36V80H20Z M56,90v32H84V90Z" fillRule="evenodd" />
    <rect x="92" y="102" width="122" height="68" rx="20" />
    <path d="M160,112V86H150V70h54V86H194v26Z" />
    <path d="M24,170H216l20,26H24Z" />
    <path fillRule="evenodd" d="M70,176a26,26,0,1,1-26,26A26,26,0,0,1,70,176Zm0,18a8,8,0,1,0,8,8A8,8,0,0,0,70,194Z" />
    <path fillRule="evenodd" d="M142,184a20,20,0,1,1-20,20A20,20,0,0,1,142,184Zm0,14a6,6,0,1,0,6,6A6,6,0,0,0,142,198Z" />
    <path fillRule="evenodd" d="M186,184a20,20,0,1,1-20,20A20,20,0,0,1,186,184Zm0,14a6,6,0,1,0,6,6A6,6,0,0,0,186,198Z" />
    <circle cx="210" cy="46" r="16" />
    <circle cx="236" cy="22" r="10" />
  </>,
);

export const SteamTrainIcon: Icon = forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props} weights={STEAM_TRAIN} />
));
SteamTrainIcon.displayName = 'SteamTrainIcon';
