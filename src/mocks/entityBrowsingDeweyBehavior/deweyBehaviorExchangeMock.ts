/** 杜威号动力层行为 · 静态交换内容（入参 / 出参），无接口。 */

export interface DeweyBehaviorExchangePayload {
  /** 挂载函数名。 */
  mountedFunction: string;
  /** 交换入参（调用测试输入）。 */
  input: Record<string, unknown>;
  /** 交换出参（调用测试输出）。 */
  output: Record<string, unknown>;
}

const DEFAULT_EXCHANGE: Omit<DeweyBehaviorExchangePayload, "mountedFunction"> = {
  input: {
    ontologyId: "DDG-105",
    ontologyName: "杜威号",
    spaceId: "navy-space",
    requestId: "REQ-STATIC-001",
    timestamp: "2026-08-14T10:00:00+08:00",
  },
  output: {
    code: 200,
    message: "ok",
    data: { accepted: true },
  },
};

const EXCHANGE_BY_FUNCTION: Record<string, Omit<DeweyBehaviorExchangePayload, "mountedFunction">> = {
  ship_detection_v4: {
    input: {
      ontologyId: "DDG-105",
      ontologyName: "杜威号",
      sensor: "SPY-1D",
      area: { lon: 112.19, lat: 15.98, radiusKm: 40 },
      imageSource: "container://ship_detection_v4",
    },
    output: {
      code: 200,
      targets: [
        { type: "军舰", count: 2 },
        { type: "商船", count: 8 },
        { type: "渔船", count: 2 },
      ],
      durationSec: 2.48,
    },
  },
  fuseAisTrack: {
    input: {
      ontologyId: "DDG-105",
      aisTracks: 36,
      radarTracks: 12,
      windowMinutes: 30,
    },
    output: {
      code: 200,
      fusedTracks: 28,
      conflictResolved: 4,
    },
  },
  detectInfraredWake: {
    input: {
      ontologyId: "DDG-105",
      band: "MWIR",
      frameCount: 120,
    },
    output: {
      code: 200,
      wakeDetected: true,
      confidence: 0.86,
    },
  },
  identifySonarContact: {
    input: {
      ontologyId: "DDG-105",
      sonarArray: "towed",
      contactId: "SONAR-7781",
    },
    output: {
      code: 200,
      classification: "水面舰艇",
      bearing: 214.5,
    },
  },
  target_identify: {
    input: {
      ontologyId: "DDG-105",
      featureVectorId: "FV-9912",
    },
    output: {
      code: 200,
      label: "驱逐舰",
      confidence: 0.91,
    },
  },
  spy6_radar_search: {
    input: {
      ontologyId: "DDG-105",
      mode: "volume-search",
      sectorDeg: 120,
    },
    output: {
      code: 200,
      tracks: 15,
      newDetections: 3,
    },
  },
  continuous_track: {
    input: {
      ontologyId: "DDG-105",
      targetId: "TGT-5520",
      durationMin: 45,
    },
    output: {
      code: 200,
      trackQuality: "high",
      dropouts: 0,
    },
  },
};

/**
 * @description 按挂载函数取静态交换入参/出参；未知函数回落默认样例。
 * @param mountedFunction 挂载函数名。
 * @returns 交换内容。
 */
export function resolveDeweyBehaviorExchange(mountedFunction: string): DeweyBehaviorExchangePayload {
  const key = mountedFunction.trim();
  const payload = EXCHANGE_BY_FUNCTION[key] ?? DEFAULT_EXCHANGE;
  return {
    mountedFunction: key || "unknown",
    input: structuredClone(payload.input),
    output: structuredClone(payload.output),
  };
}
