/// <reference types="react" />
import { Effect } from 'postprocessing';
export declare enum RampType {
    Linear = 0,
    Radial = 1,
    MirroredLinear = 2
}
export declare class RampEffect extends Effect {
    constructor({ 
    /**
     * Type of ramp gradient.
     */
    rampType, 
    /**
     * Starting point of the ramp gradient in normalized coordinates.
     *
     * Ranges from `[0 - 1]` as `[x, y]`. Default is `[0.5, 0.5]`.
     */
    rampStart, 
    /**
     * Ending point of the ramp gradient in normalized coordinates.
     *
     * Ranges from `[0 - 1]` as `[x, y]`. Default is `[1, 1]`
     */
    rampEnd, 
    /**
     * Color at the starting point of the gradient.
     *
     * Default is black: `[0, 0, 0, 1]`
     */
    startColor, 
    /**
     * Color at the ending point of the gradient.
     *
     * Default is white: `[1, 1, 1, 1]`
     */
    endColor, 
    /**
     * Bias for the interpolation curve when both bias and gain are 0.5.
     *
     * Ranges from `[0 - 1]`. Default is `0.5`.
     */
    rampBias, 
    /**
     * Gain for the interpolation curve when both bias and gain are 0.5.
     *
     * Ranges from `[0 - 1]`. Default is `0.5`.
     */
    rampGain, 
    /**
     * When enabled, the ramp gradient is used as an effect mask, and colors are ignored.
     *
     * Default is `false`.
     */
    rampMask, 
    /**
     * Controls whether the ramp gradient is inverted.
     *
     * When disabled, rampStart is transparent and rampEnd is opaque.
     *
     * Default is `false`.
     */
    rampInvert, ...params }?: {
        rampType?: RampType | undefined;
        rampStart?: number[] | undefined;
        rampEnd?: number[] | undefined;
        startColor?: number[] | undefined;
        endColor?: number[] | undefined;
        rampBias?: number | undefined;
        rampGain?: number | undefined;
        rampMask?: boolean | undefined;
        rampInvert?: boolean | undefined;
    });
}
export declare const Ramp: import("react").ForwardRefExoticComponent<Omit<import("@react-three/fiber").ExtendedColors<import("@react-three/fiber").Overwrite<Partial<RampEffect>, import("@react-three/fiber").NodeProps<RampEffect, typeof RampEffect>>> & {
    rampType?: RampType | undefined;
    rampStart?: number[] | undefined;
    rampEnd?: number[] | undefined;
    startColor?: number[] | undefined;
    endColor?: number[] | undefined;
    rampBias?: number | undefined;
    rampGain?: number | undefined;
    rampMask?: boolean | undefined;
    rampInvert?: boolean | undefined;
} & {
    blendFunction?: import("postprocessing").BlendFunction | undefined;
    opacity?: number | undefined;
}, "ref"> & import("react").RefAttributes<typeof RampEffect>>;
