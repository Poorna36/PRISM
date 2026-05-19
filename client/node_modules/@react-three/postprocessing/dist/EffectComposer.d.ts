import type { Camera, Scene, TextureDataType } from 'three';
import React from 'react';
import { EffectComposer as EffectComposerImpl, NormalPass, DepthDownsamplingPass } from 'postprocessing';
export declare const EffectComposerContext: React.Context<{
    composer: EffectComposerImpl;
    normalPass: NormalPass | null;
    downSamplingPass: DepthDownsamplingPass | null;
    camera: Camera;
    scene: Scene;
    resolutionScale?: number | undefined;
}>;
export type EffectComposerProps = {
    enabled?: boolean;
    children: JSX.Element | JSX.Element[];
    depthBuffer?: boolean;
    /** Only used for SSGI currently, leave it disabled for everything else unless it's needed */
    enableNormalPass?: boolean;
    stencilBuffer?: boolean;
    autoClear?: boolean;
    resolutionScale?: number;
    multisampling?: number;
    frameBufferType?: TextureDataType;
    renderPriority?: number;
    camera?: Camera;
    scene?: Scene;
};
export declare const EffectComposer: React.MemoExoticComponent<React.ForwardRefExoticComponent<EffectComposerProps & React.RefAttributes<EffectComposerImpl>>>;
