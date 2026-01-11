import { apiClient } from "./client";

export type UsageTrendPoint = {
  date: string;
  requests: number;
  tokens: number;
};

export type UsageSummaryResponse = {
  plan: {
    id: string;
    name: string;
    requestLimit: number;
    pipelineLimit: number;
    storageLimitMb: number;
    providers: string[];
    vectorStores: string[];
    embeddingModels: string[];
    isFree: boolean;
    comingSoon: boolean;
    baseStorageLimitMb?: number;
  };
  usage: {
    requestsUsed: number;
    requestLimit: number;
    pipelinesUsed: number;
    pipelineLimit: number;
    storageUsedMb: number;
    storageLimitMb: number;
    pipelineBreakdown?: Array<{
      name: string;
      sizeMb: number;
    }>;
  };
  trend: UsageTrendPoint[];
};

export const usageService = {
  async getSummary() {
    return apiClient.get<UsageSummaryResponse>("/usage/summary");
  },
};
