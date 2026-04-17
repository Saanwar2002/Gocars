import { 
  brandColors as dsBrandColors, 
  neutralColors as dsNeutralColors,
  typography as dsTypography,
  spacing as dsSpacing,
  borderRadius as dsBorderRadius,
  boxShadow as dsBoxShadow,
  animation as dsAnimation
} from './design-system';

export const brandColors = {
  primary: dsBrandColors.primary,
  secondary: dsBrandColors.success, // Success is used as secondary in design-system
  accent: {
    DEFAULT: dsBrandColors.accent[500],
    ...dsBrandColors.accent,
    purple: dsBrandColors.accent,
    green: dsBrandColors.success,
    yellow: dsBrandColors.warning,
    red: dsBrandColors.danger,
  },
  neutral: dsNeutralColors.gray,
};

export const typography = dsTypography;
export const spacing = dsSpacing;
export const borderRadius = dsBorderRadius;
export const boxShadow = dsBoxShadow;
export const animation = dsAnimation;

export default {
  brandColors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  animation,
};
