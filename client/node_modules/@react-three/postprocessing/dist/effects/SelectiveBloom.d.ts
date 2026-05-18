import { SelectiveBloomEffect } from 'postprocessing';
import type { BloomEffectOptions } from 'postprocessing';
import React, { MutableRefObject } from 'react';
import { Object3D } from 'three';
type ObjectRef = MutableRefObject<Object3D>;
export type SelectiveBloomProps = BloomEffectOptions & Partial<{
    lights: Object3D[] | ObjectRef[];
    selection: Object3D | Object3D[] | ObjectRef | ObjectRef[];
    selectionLayer: number;
    inverted: boolean;
    ignoreBackground: boolean;
}>;
export declare const SelectiveBloom: React.ForwardRefExoticComponent<BloomEffectOptions & Partial<{
    lights: Object3D[] | ObjectRef[];
    selection: Object3D | Object3D[] | ObjectRef | ObjectRef[];
    selectionLayer: number;
    inverted: boolean;
    ignoreBackground: boolean;
}> & React.RefAttributes<SelectiveBloomEffect>>;
export {};
